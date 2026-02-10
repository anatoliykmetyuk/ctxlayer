#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { select, input } from '@inquirer/prompts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTELLIGENCE_HOME = '.intelligence';
const PROJECTS_DIR = 'projects';
const LOCAL_DIR = '.intelligence';

const cwd = process.cwd();
const intelligenceHome = path.join(os.homedir(), INTELLIGENCE_HOME);
const projectsRoot = path.join(intelligenceHome, PROJECTS_DIR);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function repoNameFromUrl(url) {
  const cleaned = url.replace(/\/+$/, '');
  const lastSegment = cleaned.split('/').pop() || '';
  const name = lastSegment.replace(/\.git$/, '');
  if (!name) {
    throw new Error('Could not derive project name from URL: ' + url);
  }
  return name;
}

function ensureProjectsRoot() {
  if (!fs.existsSync(projectsRoot)) {
    fs.mkdirSync(projectsRoot, { recursive: true });
  }
}

function readConfig() {
  const configPath = path.join(cwd, LOCAL_DIR, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      'No config found at ' + configPath + '. Run "intel init" first.'
    );
  }
  const content = fs.readFileSync(configPath, 'utf8');

  const projectMatch = content.match(/^active-project:\s*(.+)$/m);
  const taskMatch = content.match(/^active-task:\s*(.+)$/m);

  if (!projectMatch || !projectMatch[1].trim()) {
    throw new Error('No "active-project" field found in ' + configPath);
  }

  return {
    'active-project': projectMatch[1].trim(),
    'active-task': taskMatch ? taskMatch[1].trim() : '',
  };
}

function writeConfig(config) {
  const configPath = path.join(cwd, LOCAL_DIR, 'config.yaml');
  let content = `active-project: ${config['active-project']}\n`;
  if (config['active-task']) {
    content += `active-task: ${config['active-task']}\n`;
  }
  fs.writeFileSync(configPath, content);
}

// ---------------------------------------------------------------------------
// Ensure a symlink for a task exists at <cwd>/.intelligence/<project>/<task>
// ---------------------------------------------------------------------------

function ensureTaskSymlink(projectName, taskName) {
  if (!taskName) return;

  const localProjectDir = path.join(cwd, LOCAL_DIR, projectName);
  if (!fs.existsSync(localProjectDir)) {
    fs.mkdirSync(localProjectDir, { recursive: true });
  }

  const linkPath = path.join(localProjectDir, taskName);
  if (!fs.existsSync(linkPath)) {
    const taskDir = path.join(projectsRoot, projectName, taskName);
    const target = path.resolve(taskDir);
    const type = process.platform === 'win32' ? 'dir' : undefined;
    fs.symlinkSync(target, linkPath, type);
    console.log('Created symlink', linkPath, '->', target);
  }
}

// ---------------------------------------------------------------------------
// Local setup (runs after every choice)
// ---------------------------------------------------------------------------

function setupLocal(projectName) {
  // 1. Create .intelligence/ in cwd
  const localDir = path.join(cwd, LOCAL_DIR);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
    console.log('Created', localDir);
  }

  // 2. Write config.yaml
  const configPath = path.join(localDir, 'config.yaml');
  fs.writeFileSync(configPath, `active-project: ${projectName}\n`);
  console.log('Wrote', configPath);

  // 3. Add .intelligence to .gitignore
  const gitignorePath = path.join(cwd, '.gitignore');
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }

  const lines = content.split(/\r?\n/);
  const alreadyListed = lines.some(
    (line) => line.trim() === LOCAL_DIR || line.trim() === '/' + LOCAL_DIR
  );

  if (!alreadyListed) {
    const suffix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
    fs.appendFileSync(gitignorePath, suffix + LOCAL_DIR + '\n');
    console.log('Added', LOCAL_DIR, 'to .gitignore');
  }
}

// ---------------------------------------------------------------------------
// Choice 1: Fetch from git
// ---------------------------------------------------------------------------

async function initFromGit() {
  const url = await input({ message: 'GitHub repo URL:' });
  if (!url) {
    throw new Error('URL cannot be empty');
  }

  const defaultName = repoNameFromUrl(url);
  const projectName =
    (await input({
      message: 'Project name:',
      default: defaultName,
    })) || defaultName;

  ensureProjectsRoot();

  const targetPath = path.join(projectsRoot, projectName);
  if (fs.existsSync(targetPath)) {
    throw new Error('Project folder already exists: ' + targetPath);
  }

  console.log('Cloning', url, 'into', targetPath);
  execSync(`git clone ${url} ${targetPath}`, { stdio: 'inherit' });

  setupLocal(projectName);
}

// ---------------------------------------------------------------------------
// Choice 2: Create new project from scratch
// ---------------------------------------------------------------------------

async function initFromScratch() {
  const projectName = await input({ message: 'Project name:' });
  if (!projectName) {
    throw new Error('Project name cannot be empty');
  }

  ensureProjectsRoot();

  const targetPath = path.join(projectsRoot, projectName);
  if (fs.existsSync(targetPath)) {
    throw new Error('Project folder already exists: ' + targetPath);
  }

  fs.mkdirSync(targetPath, { recursive: true });
  console.log('Created', targetPath);

  execSync('git init', { cwd: targetPath, stdio: 'inherit' });

  setupLocal(projectName);
}

// ---------------------------------------------------------------------------
// Choice 3: Use existing project
// ---------------------------------------------------------------------------

async function initFromExisting() {
  if (!fs.existsSync(projectsRoot)) {
    throw new Error('No projects directory found at ' + projectsRoot);
  }

  const entries = fs
    .readdirSync(projectsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (entries.length === 0) {
    throw new Error('No projects found in ' + projectsRoot);
  }

  const projectName = await select({
    message: 'Select a project:',
    choices: entries.map((name) => ({
      name,
      value: name,
    })),
  });

  console.log('Using project:', projectName);

  setupLocal(projectName);
}

// ---------------------------------------------------------------------------
// Init flow
// ---------------------------------------------------------------------------

async function init() {
  try {
    const choice = await select({
      message: 'How do you want to initialize the project?',
      choices: [
        { name: 'Fetch from git', value: 'git' },
        { name: 'Create a new project from scratch', value: 'scratch' },
        { name: 'Use existing project', value: 'existing' },
      ],
    });

    switch (choice) {
      case 'git':
        await initFromGit();
        break;
      case 'scratch':
        await initFromScratch();
        break;
      case 'existing':
        await initFromExisting();
        break;
    }

    console.log('\nDone.');
  } catch (err) {
    if (err.name === 'ExitPromptError') {
      // User pressed Ctrl+C
      process.exit(130);
    }
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// New task flow
// ---------------------------------------------------------------------------

async function newTask() {
  try {
    const config = readConfig();
    const projectName = config['active-project'];
    const projectDir = path.join(projectsRoot, projectName);

    if (!fs.existsSync(projectDir)) {
      throw new Error('Project directory not found: ' + projectDir);
    }

    const taskName = await input({ message: 'Task name:' });
    if (!taskName) {
      throw new Error('Task name cannot be empty');
    }

    // Create task dir with docs/ and context/ subdirs
    const taskDir = path.join(projectDir, taskName);
    if (fs.existsSync(taskDir)) {
      throw new Error('Task folder already exists: ' + taskDir);
    }

    fs.mkdirSync(path.join(taskDir, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(taskDir, 'context'), { recursive: true });
    console.log('Created', taskDir);

    // Create symlink in local .intelligence/<projectName>/ dir
    ensureTaskSymlink(projectName, taskName);

    // Set newly created task as active
    writeConfig({ 'active-project': projectName, 'active-task': taskName });

    console.log('\nDone.');
  } catch (err) {
    if (err.name === 'ExitPromptError') {
      process.exit(130);
    }
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Shared: select a task for a given project
// ---------------------------------------------------------------------------

async function selectTaskForProject(projectName, currentTask) {
  const projectDir = path.join(projectsRoot, projectName);

  if (!fs.existsSync(projectDir)) {
    throw new Error('Project directory not found: ' + projectDir);
  }

  const tasks = fs
    .readdirSync(projectDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);

  if (tasks.length === 0) {
    console.log('\nNo tasks found for this project.');
    console.log('To create a new task, run: intel new\n');
    return '';
  }

  const selectedTask = await select({
    message: 'Select active task:',
    choices: tasks.map((name) => ({ name, value: name })),
    default: currentTask || undefined,
  });

  console.log('Active task set to:', selectedTask);
  return selectedTask;
}

// ---------------------------------------------------------------------------
// Active task selector
// ---------------------------------------------------------------------------

async function activeTask() {
  try {
    const config = readConfig();
    const projectName = config['active-project'];

    const selectedTask = await selectTaskForProject(
      projectName,
      config['active-task']
    );

    // Ensure a symlink for the task exists at .intelligence/<projectName>/<task>
    ensureTaskSymlink(projectName, selectedTask);

    writeConfig({ 'active-project': projectName, 'active-task': selectedTask });
  } catch (err) {
    if (err.name === 'ExitPromptError') {
      process.exit(130);
    }
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Active project selector
// ---------------------------------------------------------------------------

async function activeProject() {
  try {
    const config = readConfig();

    if (!fs.existsSync(projectsRoot)) {
      throw new Error('No projects directory found at ' + projectsRoot);
    }

    const entries = fs
      .readdirSync(projectsRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (entries.length === 0) {
      throw new Error('No projects found in ' + projectsRoot);
    }

    const currentProject = config['active-project'];
    const selectedProject = await select({
      message: 'Select active project:',
      choices: entries.map((name) => ({ name, value: name })),
      default: currentProject || undefined,
    });

    console.log('Active project set to:', selectedProject);

    if (selectedProject === currentProject) {
      ensureTaskSymlink(selectedProject, config['active-task']);
      writeConfig({
        'active-project': selectedProject,
        'active-task': config['active-task'],
      });
    } else {
      const selectedTask = await selectTaskForProject(selectedProject, '');
      ensureTaskSymlink(selectedProject, selectedTask);
      writeConfig({
        'active-project': selectedProject,
        'active-task': selectedTask,
      });
    }
  } catch (err) {
    if (err.name === 'ExitPromptError') {
      process.exit(130);
    }
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Active status (intel active)
// ---------------------------------------------------------------------------

function activeStatus() {
  try {
    const config = readConfig();
    const project = config['active-project'];
    const task = config['active-task'] || '(none)';

    console.log(`\nActive project: ${project}`);
    console.log(`Active task:    ${task}\n`);
    console.log('To change the active project, run: intel active project');
    console.log('To change the active task, run:    intel active task');
    console.log('');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

const command = process.argv.slice(2).join(' ');

if (command === 'init') {
  await init();
} else if (command === 'new') {
  await newTask();
} else if (command === 'active task') {
  await activeTask();
} else if (command === 'active project') {
  await activeProject();
} else if (command === 'active') {
  activeStatus();
} else {
  console.log(`
Usage: intel <command>

Commands:
  init              Initialize a project (clone, create, or link an existing one)
  new               Create a new task under the current project
  active            Show the current active project and task
  active task       Select the active task for the current project
  active project    Select the active project
`);
}
