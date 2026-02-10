#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import { select, input, confirm } from '@inquirer/prompts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECTS_DIR = 'projects';
const LOCAL_DIR = '.ctxlayer';

const CWD = process.env.CONTEXT_LAYER_CWD || process.cwd();
const CONTEXT_LAYER_HOME = process.env.CONTEXT_LAYER_HOME || path.join(os.homedir(), '.ctxlayer');
const PROJECTS_ROOT = path.join(CONTEXT_LAYER_HOME, PROJECTS_DIR);

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
  if (!fs.existsSync(PROJECTS_ROOT)) {
    fs.mkdirSync(PROJECTS_ROOT, { recursive: true });
  }
}

function readConfig() {
  const configPath = path.join(CWD, LOCAL_DIR, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      'No config found at ' + configPath + '. Run "ctx init" first.'
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
  const configPath = path.join(CWD, LOCAL_DIR, 'config.yaml');
  let content = `active-project: ${config['active-project']}\n`;
  if (config['active-task']) {
    content += `active-task: ${config['active-task']}\n`;
  }
  fs.writeFileSync(configPath, content);
}

// ---------------------------------------------------------------------------
// Ensure a symlink for a task exists at <cwd>/.ctxlayer/<project>/<task>
// ---------------------------------------------------------------------------

function getLocalProjectDirs() {
  const localDir = path.join(CWD, LOCAL_DIR);
  if (!fs.existsSync(localDir)) {
    return [];
  }
  return fs
    .readdirSync(localDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function ensureTaskSymlink(projectName, taskName) {
  if (!taskName) return;

  const localProjectDir = path.join(CWD, LOCAL_DIR, projectName);
  if (!fs.existsSync(localProjectDir)) {
    fs.mkdirSync(localProjectDir, { recursive: true });
  }

  const linkPath = path.join(localProjectDir, taskName);
  if (!fs.existsSync(linkPath)) {
    const taskDir = path.join(PROJECTS_ROOT, projectName, taskName);
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
  // 1. Create .ctxlayer/ in cwd
  const localDir = path.join(CWD, LOCAL_DIR);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
    console.log('Created', localDir);
  }

  // 2. Write config.yaml
  const configPath = path.join(localDir, 'config.yaml');
  fs.writeFileSync(configPath, `active-project: ${projectName}\n`);
  console.log('Wrote', configPath);

  // 3. Add .ctxlayer to .gitignore
  const gitignorePath = path.join(CWD, '.gitignore');
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }

  const GITIGNORE_ENTRY = '/.ctxlayer/';
  const lines = content.split(/\r?\n/);
  const alreadyListed = lines.some((line) => line.trim() === GITIGNORE_ENTRY);

  if (!alreadyListed) {
    const suffix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
    fs.appendFileSync(gitignorePath, suffix + GITIGNORE_ENTRY + '\n');
    console.log('Added', GITIGNORE_ENTRY, 'to .gitignore');
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

  const targetPath = path.join(PROJECTS_ROOT, projectName);
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

  const targetPath = path.join(PROJECTS_ROOT, projectName);
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
  if (!fs.existsSync(PROJECTS_ROOT)) {
    throw new Error('No projects directory found at ' + PROJECTS_ROOT);
  }

  const entries = fs
    .readdirSync(PROJECTS_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (entries.length === 0) {
    throw new Error('No projects found in ' + PROJECTS_ROOT);
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

async function newTask(nameArg) {
  try {
    const config = readConfig();
    const projectName = config['active-project'];
    const projectDir = path.join(PROJECTS_ROOT, projectName);

    if (!fs.existsSync(projectDir)) {
      throw new Error('Project directory not found: ' + projectDir);
    }

    const taskName = nameArg || await input({ message: 'Task name:' });
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

    // Create symlink in local .ctxlayer/<projectName>/ dir
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
  const projectDir = path.join(PROJECTS_ROOT, projectName);

  if (!fs.existsSync(projectDir)) {
    throw new Error('Project directory not found: ' + projectDir);
  }

  const tasks = fs
    .readdirSync(projectDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);

  if (tasks.length === 0) {
    console.log('\nNo tasks found for this project.');
    console.log('To create a new task, run: ctx new\n');
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

    // Ensure a symlink for the task exists at .ctxlayer/<projectName>/<task>
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

    if (!fs.existsSync(PROJECTS_ROOT)) {
      throw new Error('No projects directory found at ' + PROJECTS_ROOT);
    }

    const entries = fs
      .readdirSync(PROJECTS_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (entries.length === 0) {
      throw new Error('No projects found in ' + PROJECTS_ROOT);
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
// Active status (ctx active)
// ---------------------------------------------------------------------------

function activeStatus() {
  try {
    const config = readConfig();
    const project = config['active-project'];
    const task = config['active-task'] || '(none)';

    console.log(`\nActive project: ${project}`);
    console.log(`Active task:    ${task}\n`);
    console.log('To change the active project, run: ctx active project');
    console.log('To change the active task, run:    ctx active task');
    console.log('');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// ctx git - run git in the current task directory
// ---------------------------------------------------------------------------

function intelGit() {
  try {
    const config = readConfig();
    const projectName = config['active-project'];
    const taskName = config['active-task'];

    if (!taskName) {
      throw new Error('No active task set. Run "ctx active task" to select a task.');
    }

    const taskDir = path.join(PROJECTS_ROOT, projectName, taskName);
    if (!fs.existsSync(taskDir)) {
      throw new Error('Task directory not found: ' + taskDir);
    }

    const args = process.argv.slice(2);
    const gitArgs = args[0] === 'git' ? args.slice(1) : [];

    const result = spawnSync('git', gitArgs, { cwd: taskDir, stdio: 'inherit' });
    if (result.status !== 0) {
      const err = new Error(result.error?.message || `Command failed: git`);
      err.status = result.status;
      err.signal = result.signal;
      throw err;
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
// ctx drop task - remove symlink to a task
// ---------------------------------------------------------------------------

async function dropTask(taskNameArg) {
  try {
    const config = readConfig();

    const projects = getLocalProjectDirs();
    if (projects.length === 0) {
      throw new Error('No project directories found in .ctxlayer/. Import a task first.');
    }

    let selectedProject;
    let selectedTask;

    if (taskNameArg) {
      selectedProject = config['active-project'];
      const projectDir = path.join(CWD, LOCAL_DIR, selectedProject);
      if (!fs.existsSync(projectDir)) {
        throw new Error('Project directory not found: ' + projectDir);
      }
      const linkPath = path.join(projectDir, taskNameArg);
      if (!fs.existsSync(linkPath)) {
        throw new Error('Task symlink not found: ' + linkPath);
      }
      selectedTask = taskNameArg;
    } else {
      selectedProject = await select({
        message: 'Select project:',
        choices: projects.map((name) => ({ name, value: name })),
      });

      const projectDir = path.join(CWD, LOCAL_DIR, selectedProject);
      const entries = fs
        .readdirSync(projectDir, { withFileTypes: true })
        .filter((e) => e.isSymbolicLink() || (e.isDirectory() && !e.name.startsWith('.')))
        .map((e) => e.name);

      if (entries.length === 0) {
        throw new Error('No tasks found in project "' + selectedProject + '".');
      }

      selectedTask = await select({
        message: 'Select task to drop:',
        choices: entries.map((name) => ({ name, value: name })),
      });
    }

    const linkPath = path.join(CWD, LOCAL_DIR, selectedProject, selectedTask);
    fs.unlinkSync(linkPath);
    console.log('Dropped symlink:', linkPath);

    const projectDir = path.join(CWD, LOCAL_DIR, selectedProject);
    const remaining = fs.readdirSync(projectDir);
    if (remaining.length === 0) {
      fs.rmdirSync(projectDir);
      console.log('Removed empty project directory:', projectDir);
    }

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
// ctx drop project - remove project directory from local .ctxlayer/
// ---------------------------------------------------------------------------

async function dropProject() {
  try {
    readConfig();

    const projects = getLocalProjectDirs();
    if (projects.length === 0) {
      throw new Error('No project directories found in .ctxlayer/.');
    }

    const selectedProject = await select({
      message: 'Select project to drop:',
      choices: projects.map((name) => ({ name, value: name })),
    });

    const localProjectDir = path.join(CWD, LOCAL_DIR, selectedProject);
    const confirmed = await confirm({
      message: `Remove project directory "${selectedProject}" from .ctxlayer/?`,
      default: false,
    });

    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }

    fs.rmSync(localProjectDir, { recursive: true });
    console.log('Removed:', localProjectDir);
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
// ctx delete task - remove task from context store and symlink
// ---------------------------------------------------------------------------

async function deleteTask() {
  try {
    readConfig();

    if (!fs.existsSync(PROJECTS_ROOT)) {
      throw new Error('No projects directory found at ' + PROJECTS_ROOT);
    }

    const projects = fs
      .readdirSync(PROJECTS_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (projects.length === 0) {
      throw new Error('No projects found in ' + PROJECTS_ROOT);
    }

    const selectedProject = await select({
      message: 'Select project:',
      choices: projects.map((name) => ({ name, value: name })),
    });

    const projectDir = path.join(PROJECTS_ROOT, selectedProject);
    const tasks = fs
      .readdirSync(projectDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);

    if (tasks.length === 0) {
      throw new Error('No tasks found in project "' + selectedProject + '".');
    }

    const selectedTask = await select({
      message: 'Select task to delete:',
      choices: tasks.map((name) => ({ name, value: name })),
    });

    const confirmed = await confirm({
      message: `Permanently delete task "${selectedTask}" from project "${selectedProject}"?`,
      default: false,
    });

    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }

    const taskDir = path.join(PROJECTS_ROOT, selectedProject, selectedTask);
    fs.rmSync(taskDir, { recursive: true });
    console.log('Deleted:', taskDir);

    const linkPath = path.join(CWD, LOCAL_DIR, selectedProject, selectedTask);
    if (fs.existsSync(linkPath)) {
      fs.unlinkSync(linkPath);
      console.log('Removed symlink:', linkPath);
    }

    const localProjectDir = path.join(CWD, LOCAL_DIR, selectedProject);
    if (fs.existsSync(localProjectDir)) {
      const remaining = fs.readdirSync(localProjectDir);
      if (remaining.length === 0) {
        fs.rmSync(localProjectDir, { recursive: true });
        console.log('Removed empty project directory:', localProjectDir);
      }
    }

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
// ctx delete project - remove project from context store and local dir
// ---------------------------------------------------------------------------

async function deleteProject() {
  try {
    readConfig();

    if (!fs.existsSync(PROJECTS_ROOT)) {
      throw new Error('No projects directory found at ' + PROJECTS_ROOT);
    }

    const projects = fs
      .readdirSync(PROJECTS_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (projects.length === 0) {
      throw new Error('No projects found in ' + PROJECTS_ROOT);
    }

    const selectedProject = await select({
      message: 'Select project to delete:',
      choices: projects.map((name) => ({ name, value: name })),
    });

    const confirmed = await confirm({
      message: `Permanently delete project "${selectedProject}" from the context store?`,
      default: false,
    });

    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }

    const projectDir = path.join(PROJECTS_ROOT, selectedProject);
    fs.rmSync(projectDir, { recursive: true });
    console.log('Deleted:', projectDir);

    const localProjectDir = path.join(CWD, LOCAL_DIR, selectedProject);
    if (fs.existsSync(localProjectDir)) {
      fs.rmSync(localProjectDir, { recursive: true });
      console.log('Removed local directory:', localProjectDir);
    }

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
// Import task from any project
// ---------------------------------------------------------------------------

async function importTask() {
  try {
    // Verify local setup exists
    readConfig();

    if (!fs.existsSync(PROJECTS_ROOT)) {
      throw new Error('No projects directory found at ' + PROJECTS_ROOT);
    }

    const projects = fs
      .readdirSync(PROJECTS_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (projects.length === 0) {
      throw new Error('No projects found in ' + PROJECTS_ROOT);
    }

    const selectedProject = await select({
      message: 'Select a project:',
      choices: projects.map((name) => ({ name, value: name })),
    });

    const projectDir = path.join(PROJECTS_ROOT, selectedProject);
    const tasks = fs
      .readdirSync(projectDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);

    if (tasks.length === 0) {
      console.log('\nNo tasks found in project "' + selectedProject + '".');
      console.log('To create a new task, run: ctx new\n');
      return;
    }

    const selectedTask = await select({
      message: 'Select a task to import:',
      choices: tasks.map((name) => ({ name, value: name })),
    });

    ensureTaskSymlink(selectedProject, selectedTask);

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
// Entrypoint
// ---------------------------------------------------------------------------

const command = process.argv.slice(2).join(' ');

if (command === 'git' || command.startsWith('git ')) {
  intelGit();
} else if (command === 'drop project') {
  await dropProject();
} else if (command === 'drop task' || command.startsWith('drop task ')) {
  await dropTask(command.slice(10).trim() || undefined);
} else if (command === 'delete project') {
  await deleteProject();
} else if (command === 'delete task') {
  await deleteTask();
} else if (command === 'init') {
  await init();
} else if (command === 'new' || command.startsWith('new ')) {
  await newTask(command.slice(4) || undefined);
} else if (command === 'import') {
  await importTask();
} else if (command === 'active task') {
  await activeTask();
} else if (command === 'active project') {
  await activeProject();
} else if (command === 'active') {
  activeStatus();
} else {
  console.log(`
Usage: ctx <command>

Commands:
  init              Initialize a project (clone, create, or link an existing one)
  new [name]        Create a new task under the current project
  import            Import a task from any project as a symlink
  git [args...]     Run git in the current task directory
  drop task [name]  Remove a task symlink (with optional task name)
  drop project      Remove a project directory from local .ctxlayer/
  delete task       Delete a task from the context store and remove its symlink
  delete project    Delete a project from the context store and remove its local directory
  active            Show the current active project and task
  active task       Select the active task for the current project
  active project    Select the active project
`);
}

// ---------------------------------------------------------------------------
// Exports (for testing)
// ---------------------------------------------------------------------------

export {
  init,
  newTask,
  activeStatus,
  activeProject,
  activeTask,
  importTask,
  intelGit,
  dropTask,
  dropProject,
  deleteTask,
  deleteProject,
};
