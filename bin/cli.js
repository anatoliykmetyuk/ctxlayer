#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import { select, input, confirm } from '@inquirer/prompts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOMAINS_DIR = 'domains';
const LOCAL_DIR = '.ctxlayer';

const CWD = process.env.CONTEXT_LAYER_CWD || process.cwd();
const CONTEXT_LAYER_HOME = process.env.CONTEXT_LAYER_HOME || path.join(os.homedir(), '.agents', 'ctxlayer');
const DOMAINS_ROOT = path.join(CONTEXT_LAYER_HOME, DOMAINS_DIR);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function repoNameFromUrl(url) {
  const cleaned = url.replace(/\/+$/, '');
  const lastSegment = cleaned.split('/').pop() || '';
  const name = lastSegment.replace(/\.git$/, '');
  if (!name) {
    throw new Error('Could not derive domain name from URL: ' + url);
  }
  return name;
}

function ensureDomainsRoot() {
  if (!fs.existsSync(DOMAINS_ROOT)) {
    fs.mkdirSync(DOMAINS_ROOT, { recursive: true });
  }
}

function readConfig() {
  const configPath = path.join(CWD, LOCAL_DIR, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      'No config found at ' + configPath + '. Run "ctx new" first.'
    );
  }
  const content = fs.readFileSync(configPath, 'utf8');

  const domainMatch = content.match(/^active-domain:\s*(.+)$/m);
  const taskMatch = content.match(/^active-task:\s*(.+)$/m);

  if (!domainMatch || !domainMatch[1].trim()) {
    throw new Error('No "active-domain" field found in ' + configPath);
  }

  return {
    'active-domain': domainMatch[1].trim(),
    'active-task': taskMatch ? taskMatch[1].trim() : '',
  };
}

function readConfigOrNull() {
  const configPath = path.join(CWD, LOCAL_DIR, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const content = fs.readFileSync(configPath, 'utf8');
  const domainMatch = content.match(/^active-domain:\s*(.+)$/m);
  const taskMatch = content.match(/^active-task:\s*(.+)$/m);
  if (!domainMatch || !domainMatch[1].trim()) {
    return null;
  }
  return {
    'active-domain': domainMatch[1].trim(),
    'active-task': taskMatch ? taskMatch[1].trim() : '',
  };
}

function writeConfig(config) {
  const configPath = path.join(CWD, LOCAL_DIR, 'config.yaml');
  let content = `active-domain: ${config['active-domain']}\n`;
  if (config['active-task']) {
    content += `active-task: ${config['active-task']}\n`;
  }
  fs.writeFileSync(configPath, content);
}

// ---------------------------------------------------------------------------
// Ensure a symlink for a task exists at <cwd>/.ctxlayer/<domain>/<task>
// ---------------------------------------------------------------------------

function getLocalDomainDirs() {
  const localDir = path.join(CWD, LOCAL_DIR);
  if (!fs.existsSync(localDir)) {
    return [];
  }
  return fs
    .readdirSync(localDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function ensureTaskSymlink(domainName, taskName) {
  if (!taskName) return;

  const localDomainDir = path.join(CWD, LOCAL_DIR, domainName);
  if (!fs.existsSync(localDomainDir)) {
    fs.mkdirSync(localDomainDir, { recursive: true });
  }

  const linkPath = path.join(localDomainDir, taskName);
  if (!fs.existsSync(linkPath)) {
    const taskDir = path.join(DOMAINS_ROOT, domainName, taskName);
    const target = path.resolve(taskDir);
    const type = process.platform === 'win32' ? 'dir' : undefined;
    fs.symlinkSync(target, linkPath, type);
    console.log('Created symlink', linkPath, '->', target);
  }
}

/**
 * Set the active domain and task. Call after domain and task are selected.
 * 1. Updates config.yaml (active-domain, active-task)
 * 2. Ensures workspace structure: domain dir under .ctxlayer/<domain>/, symlink to task
 */
function setActiveDomainAndTask(domainName, taskName) {
  writeConfig({ 'active-domain': domainName, 'active-task': taskName });
  ensureTaskSymlink(domainName, taskName);
}

// ---------------------------------------------------------------------------
// Local setup (runs after every choice)
// ---------------------------------------------------------------------------

function setupLocal(domainName) {
  // 1. Create .ctxlayer/ in cwd
  const localDir = path.join(CWD, LOCAL_DIR);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
    console.log('Created', localDir);
  }

  // 2. Write config.yaml
  const configPath = path.join(localDir, 'config.yaml');
  fs.writeFileSync(configPath, `active-domain: ${domainName}\n`);
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
// Ensure workspace initialized (creates .ctxlayer and config if missing)
// ---------------------------------------------------------------------------

function ensureWorkspaceInitialized() {
  const localDir = path.join(CWD, LOCAL_DIR);
  const configPath = path.join(localDir, 'config.yaml');

  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
    console.log('Created', localDir);
  }

  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, '');
    console.log('Wrote', configPath);
  }

  const gitignorePath = path.join(CWD, '.gitignore');
  const GITIGNORE_ENTRY = '/.ctxlayer/';
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }
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
  const domainName =
    (await input({
      message: 'Domain name:',
      default: defaultName,
    })) || defaultName;

  ensureDomainsRoot();

  const targetPath = path.join(DOMAINS_ROOT, domainName);
  if (fs.existsSync(targetPath)) {
    throw new Error('Domain folder already exists: ' + targetPath);
  }

  console.log('Cloning', url, 'into', targetPath);
  execSync(`git clone ${url} ${targetPath}`, { stdio: 'inherit' });

  setupLocal(domainName);
  return domainName;
}

// ---------------------------------------------------------------------------
// Choice 2: Create new domain from scratch
// ---------------------------------------------------------------------------

async function initFromScratch() {
  const domainName = await input({ message: 'Domain name:' });
  if (!domainName) {
    throw new Error('Domain name cannot be empty');
  }

  ensureDomainsRoot();

  const targetPath = path.join(DOMAINS_ROOT, domainName);
  if (fs.existsSync(targetPath)) {
    throw new Error('Domain folder already exists: ' + targetPath);
  }

  fs.mkdirSync(targetPath, { recursive: true });
  console.log('Created', targetPath);

  execSync('git init', { cwd: targetPath, stdio: 'inherit' });

  setupLocal(domainName);
  return domainName;
}

// ---------------------------------------------------------------------------
// Choice 3: Use existing domain
// ---------------------------------------------------------------------------

async function initFromExisting() {
  if (!fs.existsSync(DOMAINS_ROOT)) {
    throw new Error('No domains directory found at ' + DOMAINS_ROOT);
  }

  const entries = fs
    .readdirSync(DOMAINS_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (entries.length === 0) {
    throw new Error('No domains found in ' + DOMAINS_ROOT);
  }

  const domainName = await select({
    message: 'Select a domain:',
    choices: entries.map((name) => ({
      name,
      value: name,
    })),
  });

  console.log('Using domain:', domainName);

  setupLocal(domainName);
}

// ---------------------------------------------------------------------------
// Init flow
// ---------------------------------------------------------------------------

async function init() {
  try {
    const choice = await select({
      message: 'How do you want to initialize the domain?',
      choices: [
        { name: 'Fetch from git', value: 'git' },
        { name: 'Create a new domain from scratch', value: 'scratch' },
        { name: 'Use existing domain', value: 'existing' },
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
// Create task in domain (shared by newTask)
// ---------------------------------------------------------------------------

async function createTaskInDomain(domainName, taskNameArg) {
  const domainDir = path.join(DOMAINS_ROOT, domainName);
  if (!fs.existsSync(domainDir)) {
    throw new Error('Domain directory not found: ' + domainDir);
  }

  const taskName = taskNameArg || (await input({ message: 'Task name:' }));
  if (!taskName) {
    throw new Error('Task name cannot be empty');
  }

  const taskDir = path.join(domainDir, taskName);
  if (fs.existsSync(taskDir)) {
    throw new Error('Task folder already exists: ' + taskDir);
  }

  fs.mkdirSync(path.join(taskDir, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(taskDir, 'data'), { recursive: true });
  console.log('Created', taskDir);

  ensureTaskSymlink(domainName, taskName);
  writeConfig({ 'active-domain': domainName, 'active-task': taskName });
  return taskName;
}

// ---------------------------------------------------------------------------
// New task flow (single creative entry point)
// ---------------------------------------------------------------------------

async function newTask(nameArg) {
  try {
    ensureWorkspaceInitialized();

    const config = readConfigOrNull();
    const domainDir = config
      ? path.join(DOMAINS_ROOT, config['active-domain'])
      : null;
    const hasValidDomain = config && domainDir && fs.existsSync(domainDir);

    let domainName;
    if (!hasValidDomain) {
      domainName = await selectOrCreateDomain();
    } else {
      const useCurrent = await confirm({
        message: `Use current active domain [${config['active-domain']}] for new task?`,
        default: true,
      });
      if (useCurrent) {
        domainName = config['active-domain'];
      } else {
        domainName = await selectOrCreateDomain();
      }
    }

    await createTaskInDomain(domainName, nameArg);
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
// Shared: select or create domain (used by newTask)
// ---------------------------------------------------------------------------

const FETCH_GIT = '__fetch_git__';
const CREATE_SCRATCH = '__create_scratch__';
const SELECT_EXISTING = '__select_existing__';

async function selectOrCreateDomain() {
  ensureDomainsRoot();

  const entries = fs.existsSync(DOMAINS_ROOT)
    ? fs
        .readdirSync(DOMAINS_ROOT, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

  const firstChoices = [
    { name: 'Fetch from git', value: FETCH_GIT },
    { name: 'Create from scratch', value: CREATE_SCRATCH },
  ];
  if (entries.length > 0) {
    firstChoices.push({ name: 'Select existing domain', value: SELECT_EXISTING });
  }

  const selected = await select({
    message: 'Select or create domain:',
    choices: firstChoices,
  });

  if (selected === FETCH_GIT) {
    return await initFromGit();
  }
  if (selected === CREATE_SCRATCH) {
    return await initFromScratch();
  }

  if (selected === SELECT_EXISTING) {
    const domainName = await select({
      message: 'Select domain:',
      choices: entries.map((name) => ({ name, value: name })),
    });
    const configPath = path.join(CWD, LOCAL_DIR, 'config.yaml');
    if (!fs.existsSync(configPath)) {
      setupLocal(domainName);
    }
    return domainName;
  }

  throw new Error('Unexpected selection');
}

// ---------------------------------------------------------------------------
// Status (ctx status)
// ---------------------------------------------------------------------------

function status() {
  try {
    const config = readConfig();
    const domain = config['active-domain'];
    const task = config['active-task'] || '(none)';

    console.log(`\nActive domain: ${domain}`);
    console.log(`Active task:   ${task}`);

    // Git tracking info — domain directory in context layer home (system-wide)
    if (config['active-domain']) {
      const domainDir = path.join(DOMAINS_ROOT, domain);
      if (fs.existsSync(domainDir)) {
        const gitDir = path.join(domainDir, '.git');
        if (fs.existsSync(gitDir)) {
          const noEmit = { stdio: ['ignore', 'pipe', 'pipe'] };
          try {
            const headResult = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
              cwd: domainDir,
              encoding: 'utf8',
              ...noEmit,
            });
            const branch = (headResult.stdout || '').trim();
            if (headResult.status !== 0 || !branch) throw new Error('no head');
            try {
              const remoteResult = spawnSync('git', ['config', '--get', 'branch.' + branch + '.remote'], {
                cwd: domainDir,
                encoding: 'utf8',
                ...noEmit,
              });
              const remote = (remoteResult.stdout || '').trim();
              if (remoteResult.status !== 0 || !remote) throw new Error('no remote');
              const urlResult = spawnSync('git', ['remote', 'get-url', remote], {
                cwd: domainDir,
                encoding: 'utf8',
                ...noEmit,
              });
              const url = (urlResult.stdout || '').trim();
              if (urlResult.status !== 0 || !url) throw new Error('no url');
              const repoName = repoNameFromUrl(url);
              console.log(`\nGit branch: ${branch}`);
              console.log(`Repo:       ${repoName}`);
              console.log(`Remote:     ${url}\n`);
            } catch {
              console.log('\nDomain is not synced to git. Push your branch to set up tracking.\n');
            }
          } catch {
            console.log('\nDomain is not synced to git.\n');
          }
        } else {
          console.log('\nDomain is not synced to git.\n');
        }
      }
    } else {
      console.log('');
    }
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
    const domainName = config['active-domain'];
    const taskName = config['active-task'];

    if (!taskName) {
      throw new Error('No active task set. Run "ctx new" to create a task.');
    }

    const taskDir = path.join(DOMAINS_ROOT, domainName, taskName);
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

    const domains = getLocalDomainDirs();
    if (domains.length === 0) {
      throw new Error('No domain directories found in .ctxlayer/. Import a task first.');
    }

    let selectedDomain;
    let selectedTask;

    if (taskNameArg) {
      selectedDomain = config['active-domain'];
      const domainDir = path.join(CWD, LOCAL_DIR, selectedDomain);
      if (!fs.existsSync(domainDir)) {
        throw new Error('Domain directory not found: ' + domainDir);
      }
      const linkPath = path.join(domainDir, taskNameArg);
      if (!fs.existsSync(linkPath)) {
        throw new Error('Task symlink not found: ' + linkPath);
      }
      selectedTask = taskNameArg;
    } else {
      selectedDomain = await select({
        message: 'Select domain:',
        choices: domains.map((name) => ({ name, value: name })),
      });

      const domainDir = path.join(CWD, LOCAL_DIR, selectedDomain);
      const entries = fs
        .readdirSync(domainDir, { withFileTypes: true })
        .filter((e) => e.isSymbolicLink() || (e.isDirectory() && !e.name.startsWith('.')))
        .map((e) => e.name);

      if (entries.length === 0) {
        throw new Error('No tasks found in domain "' + selectedDomain + '".');
      }

      selectedTask = await select({
        message: 'Select task to drop:',
        choices: entries.map((name) => ({ name, value: name })),
      });
    }

    const linkPath = path.join(CWD, LOCAL_DIR, selectedDomain, selectedTask);
    fs.unlinkSync(linkPath);
    console.log('Dropped symlink:', linkPath);

    const domainDir = path.join(CWD, LOCAL_DIR, selectedDomain);
    const remaining = fs.readdirSync(domainDir);
    if (remaining.length === 0) {
      fs.rmdirSync(domainDir);
      console.log('Removed empty domain directory:', domainDir);
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
// ctx drop domain - remove domain directory from local .ctxlayer/
// ---------------------------------------------------------------------------

async function dropDomain(domainNameArg) {
  try {
    readConfig();

    const domains = getLocalDomainDirs();
    if (domains.length === 0) {
      throw new Error('No domain directories found in .ctxlayer/.');
    }

    let selectedDomain;
    if (domainNameArg) {
      if (!domains.includes(domainNameArg)) {
        const localDomainDir = path.join(CWD, LOCAL_DIR, domainNameArg);
        throw new Error('Domain directory not found: ' + localDomainDir);
      }
      selectedDomain = domainNameArg;
    } else {
      selectedDomain = await select({
        message: 'Select domain to drop:',
        choices: domains.map((name) => ({ name, value: name })),
      });
    }

    const localDomainDir = path.join(CWD, LOCAL_DIR, selectedDomain);
    const confirmed = await confirm({
      message: `Remove domain directory "${selectedDomain}" from .ctxlayer/?`,
      default: false,
    });

    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }

    fs.rmSync(localDomainDir, { recursive: true });
    console.log('Removed:', localDomainDir);
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

    if (!fs.existsSync(DOMAINS_ROOT)) {
      throw new Error('No domains directory found at ' + DOMAINS_ROOT);
    }

    const domains = fs
      .readdirSync(DOMAINS_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (domains.length === 0) {
      throw new Error('No domains found in ' + DOMAINS_ROOT);
    }

    const selectedDomain = await select({
      message: 'Select domain:',
      choices: domains.map((name) => ({ name, value: name })),
    });

    const domainDir = path.join(DOMAINS_ROOT, selectedDomain);
    const tasks = fs
      .readdirSync(domainDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);

    if (tasks.length === 0) {
      throw new Error('No tasks found in domain "' + selectedDomain + '".');
    }

    const selectedTask = await select({
      message: 'Select task to delete:',
      choices: tasks.map((name) => ({ name, value: name })),
    });

    const confirmed = await confirm({
      message: `Permanently delete task "${selectedTask}" from domain "${selectedDomain}"?`,
      default: false,
    });

    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }

    const taskDir = path.join(DOMAINS_ROOT, selectedDomain, selectedTask);
    fs.rmSync(taskDir, { recursive: true });
    console.log('Deleted:', taskDir);

    const linkPath = path.join(CWD, LOCAL_DIR, selectedDomain, selectedTask);
    if (fs.existsSync(linkPath)) {
      fs.unlinkSync(linkPath);
      console.log('Removed symlink:', linkPath);
    }

    const localDomainDir = path.join(CWD, LOCAL_DIR, selectedDomain);
    if (fs.existsSync(localDomainDir)) {
      const remaining = fs.readdirSync(localDomainDir);
      if (remaining.length === 0) {
        fs.rmSync(localDomainDir, { recursive: true });
        console.log('Removed empty domain directory:', localDomainDir);
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
// ctx delete domain - remove domain from context store and local dir
// ---------------------------------------------------------------------------

async function deleteDomain() {
  try {
    readConfig();

    if (!fs.existsSync(DOMAINS_ROOT)) {
      throw new Error('No domains directory found at ' + DOMAINS_ROOT);
    }

    const domains = fs
      .readdirSync(DOMAINS_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (domains.length === 0) {
      throw new Error('No domains found in ' + DOMAINS_ROOT);
    }

    const selectedDomain = await select({
      message: 'Select domain to delete:',
      choices: domains.map((name) => ({ name, value: name })),
    });

    const confirmed = await confirm({
      message: `Permanently delete domain "${selectedDomain}" from the context store?`,
      default: false,
    });

    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }

    const domainDir = path.join(DOMAINS_ROOT, selectedDomain);
    fs.rmSync(domainDir, { recursive: true });
    console.log('Deleted:', domainDir);

    const localDomainDir = path.join(CWD, LOCAL_DIR, selectedDomain);
    if (fs.existsSync(localDomainDir)) {
      fs.rmSync(localDomainDir, { recursive: true });
      console.log('Removed local directory:', localDomainDir);
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
// Set active domain and task (ctx set)
// ---------------------------------------------------------------------------

async function setActive() {
  try {
    ensureWorkspaceInitialized();
    const config = readConfigOrNull();

    if (!fs.existsSync(DOMAINS_ROOT)) {
      throw new Error('No domains directory found at ' + DOMAINS_ROOT);
    }

    const domains = fs
      .readdirSync(DOMAINS_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (domains.length === 0) {
      throw new Error('No domains found in ' + DOMAINS_ROOT);
    }

    const selectedDomain = await select({
      message: 'Select a domain:',
      choices: domains.map((name) => ({ name, value: name })),
      default:
        config &&
        config['active-domain'] &&
        domains.includes(config['active-domain'])
          ? config['active-domain']
          : undefined,
    });

    const domainDir = path.join(DOMAINS_ROOT, selectedDomain);
    const tasks = fs
      .readdirSync(domainDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);

    if (tasks.length === 0) {
      throw new Error('No tasks found in domain "' + selectedDomain + '".');
    }

    const selectedTask = await select({
      message: 'Select a task:',
      choices: tasks.map((name) => ({ name, value: name })),
      default:
        config &&
        selectedDomain === config['active-domain'] &&
        config['active-task'] &&
        tasks.includes(config['active-task'])
          ? config['active-task']
          : undefined,
    });

    setActiveDomainAndTask(selectedDomain, selectedTask);
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
// Import task from any domain
// ---------------------------------------------------------------------------

async function importTask() {
  try {
    ensureWorkspaceInitialized();

    const config = readConfigOrNull();

    if (!fs.existsSync(DOMAINS_ROOT)) {
      throw new Error('No domains directory found at ' + DOMAINS_ROOT);
    }

    const domains = fs
      .readdirSync(DOMAINS_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (domains.length === 0) {
      throw new Error('No domains found in ' + DOMAINS_ROOT);
    }

    const selectedDomain = await select({
      message: 'Select a domain:',
      choices: domains.map((name) => ({ name, value: name })),
    });

    const domainDir = path.join(DOMAINS_ROOT, selectedDomain);
    const tasks = fs
      .readdirSync(domainDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);

    if (tasks.length === 0) {
      console.log('\nNo tasks found in domain "' + selectedDomain + '".');
      console.log('To create a new task, run: ctx new\n');
      return;
    }

    const selectedTask = await select({
      message: 'Select a task to import:',
      choices: tasks.map((name) => ({ name, value: name })),
    });

    const shouldSetActive =
      !config ||
      !config['active-domain'] ||
      !config['active-task'];
    if (shouldSetActive) {
      setActiveDomainAndTask(selectedDomain, selectedTask);
    } else {
      ensureTaskSymlink(selectedDomain, selectedTask);
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
// Entrypoint
// ---------------------------------------------------------------------------

const command = process.argv.slice(2).join(' ');

if (command === 'git' || command.startsWith('git ')) {
  intelGit();
} else if (command === 'drop domain' || command.startsWith('drop domain ')) {
  await dropDomain(command.slice(12).trim() || undefined);
} else if (command === 'drop task' || command.startsWith('drop task ')) {
  await dropTask(command.slice(10).trim() || undefined);
} else if (command === 'delete domain') {
  await deleteDomain();
} else if (command === 'delete task') {
  await deleteTask();
} else if (command === 'new' || command.startsWith('new ')) {
  await newTask(command.slice(4) || undefined);
} else if (command === 'import') {
  await importTask();
} else if (command === 'status') {
  status();
} else if (command === 'set') {
  await setActive();
} else {
  console.log(`
Usage: ctx <command>

Main Commands:
  new [name]        Create a new task (prompts for domain if needed)
  import            Import a task from any domain as a symlink
  status            Show the current active domain and task
  set               Set active domain and task (prompts to select)

Convenience Commands:
  git [args...]     Run git in the current task directory
  drop task [name]  Remove a task symlink (with optional task name)
  drop domain [name]  Remove a domain directory from local .ctxlayer/
  delete task       Delete a task from the context store and remove its symlink
  delete domain     Delete a domain from the context store and remove its local directory
`);
}

// ---------------------------------------------------------------------------
// Exports (for testing)
// ---------------------------------------------------------------------------

export {
  newTask,
  status,
  setActive,
  importTask,
  intelGit,
  dropTask,
  dropDomain,
  deleteTask,
  deleteDomain,
};
