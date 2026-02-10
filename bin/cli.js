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
  fs.writeFileSync(configPath, `project: ${projectName}\n`);
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
// Entrypoint
// ---------------------------------------------------------------------------

const command = process.argv[2];

if (command === 'init') {
  await init();
} else {
  console.log('Usage: intel init');
}
