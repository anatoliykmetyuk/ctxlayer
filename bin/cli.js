#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const INTELLIGENCE_HOME = '.intelligence';
const INTELLIGENCE_LINK_NAME = 'intelligence';

const cwd = process.cwd();

function getProjectSubdirName() {
  let name;
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      cwd,
    }).trim();
    name = path.basename(gitRoot);
  } catch {
    name = path.basename(cwd);
  }
  if (!name) {
    throw new Error('Could not resolve project name (git repo or current directory)');
  }
  return name;
}

function ensureIntelligenceDir() {
  const intelligenceHome = path.join(os.homedir(), INTELLIGENCE_HOME);
  const subdirName = getProjectSubdirName();
  const projectDir = path.join(intelligenceHome, subdirName);

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
    console.log('Created', projectDir);
  }

  const linkPath = path.join(cwd, INTELLIGENCE_LINK_NAME);
  if (!fs.existsSync(linkPath)) {
    const target = path.resolve(projectDir);
    const type = process.platform === 'win32' ? 'dir' : undefined;
    fs.symlinkSync(target, linkPath, type);
    console.log('Created', INTELLIGENCE_LINK_NAME, '->', target);
  } else {
    console.log(INTELLIGENCE_LINK_NAME, 'already exists');
  }
}

function addToGitExclude() {
  let gitRoot;
  try {
    gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      cwd,
    }).trim();
  } catch {
    return;
  }

  const excludePath = path.join(gitRoot, '.git', 'info', 'exclude');
  const entry = INTELLIGENCE_LINK_NAME;
  let content = '';

  if (fs.existsSync(excludePath)) {
    content = fs.readFileSync(excludePath, 'utf8');
  }

  const lines = content.split(/\r?\n/);
  const alreadyAdded = lines.some(
    (line) =>
      line.trim() === entry || line.trim() === '/' + INTELLIGENCE_LINK_NAME
  );
  if (alreadyAdded) return;

  const suffix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(excludePath, suffix + entry + '\n');
  console.log('Added', INTELLIGENCE_LINK_NAME, 'to .git/info/exclude');
}

ensureIntelligenceDir();
addToGitExclude();
