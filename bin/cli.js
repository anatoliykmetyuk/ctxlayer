#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cwd = process.cwd();
const dir = path.join(cwd, 'intelligence');

function ensureIntelligenceDir() {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created intelligence');
  } else {
    console.log('intelligence already exists');
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
  const entry = 'intelligence';
  let content = '';

  if (fs.existsSync(excludePath)) {
    content = fs.readFileSync(excludePath, 'utf8');
  }

  const lines = content.split(/\r?\n/);
  const alreadyAdded = lines.some(
    (line) => line.trim() === entry || line.trim() === '/intelligence'
  );
  if (alreadyAdded) return;

  const suffix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(excludePath, suffix + entry + '\n');
  console.log('Added intelligence to .git/info/exclude');
}

ensureIntelligenceDir();
addToGitExclude();
