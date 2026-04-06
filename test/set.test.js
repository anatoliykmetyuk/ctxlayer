import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as cp from 'child_process';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctxlayer-test-'));
const tmpHome = path.join(tmpDir, '.ctxlayer');
const tmpDomainsRoot = path.join(tmpHome, 'domains');
const tmpCwd = path.join(tmpDir, 'repo');

process.env.CONTEXT_LAYER_HOME = tmpHome;
process.env.CONTEXT_LAYER_CWD = tmpCwd;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let selectQueue = [];
let execSyncCalls = [];
let cloneFixtures = {};

mock.module('@inquirer/prompts', {
  namedExports: {
    select: async () => selectQueue.shift(),
    input: async () => '',
    confirm: async () => false,
  },
});

mock.module('child_process', {
  namedExports: {
    execSync: (command, options) => {
      execSyncCalls.push({ command, options });

      if (command.startsWith('git clone ')) {
        const parts = command.split(' ');
        const url = parts[2];
        const targetPath = parts[3];
        const tasks = cloneFixtures[url] || [];

        fs.mkdirSync(targetPath, { recursive: true });
        for (const task of tasks) {
          fs.mkdirSync(path.join(targetPath, task, 'docs'), { recursive: true });
          fs.mkdirSync(path.join(targetPath, task, 'data'), { recursive: true });
        }
      }
    },
    spawn: cp.spawn,
    spawnSync: cp.spawnSync,
  },
});

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const { setActive } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ctx set', () => {
  before(() => {
    const fixtures = {
      'domain-alpha': ['task-one', 'task-two'],
      'domain-beta': ['task-three'],
      'empty-domain': [],
    };

    for (const [domain, tasks] of Object.entries(fixtures)) {
      const domainDir = path.join(tmpDomainsRoot, domain);
      fs.mkdirSync(domainDir, { recursive: true });
      for (const task of tasks) {
        fs.mkdirSync(path.join(domainDir, task, 'docs'), { recursive: true });
        fs.mkdirSync(path.join(domainDir, task, 'data'), { recursive: true });
      }
    }

    const localDir = path.join(tmpCwd, '.ctxlayer');
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(
      path.join(localDir, 'config.yaml'),
      'active-domain: domain-alpha\nactive-task: task-one\n'
    );
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
    selectQueue = [];
    execSyncCalls = [];
    cloneFixtures = {};
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.CONTEXT_LAYER_HOME;
    delete process.env.CONTEXT_LAYER_CWD;
  });

  it('sets active domain and task and prepares workspace (config + symlink)', async () => {
    selectQueue = ['domain-beta', 'task-three'];
    await setActive();

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-domain: domain-beta'));
    assert.ok(config.includes('active-task: task-three'));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'domain-beta', 'task-three');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    const target = fs.readlinkSync(linkPath);
    assert.equal(target, path.resolve(path.join(tmpDomainsRoot, 'domain-beta', 'task-three')));

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('supports non-interactive domain and task selection', async () => {
    await setActive({ domainName: 'domain-beta', taskName: 'task-three' });

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-domain: domain-beta'));
    assert.ok(config.includes('active-task: task-three'));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'domain-beta', 'task-three');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('clones a domain from git and sets the task active', async () => {
    cloneFixtures['https://github.com/user/repo.git'] = ['pr-reviews'];

    await setActive({
      cloneFrom: 'https://github.com/user/repo.git',
      taskName: 'pr-reviews',
    });

    const expectedDomainDir = path.join(tmpDomainsRoot, 'repo');
    assert.ok(fs.existsSync(path.join(expectedDomainDir, 'pr-reviews')));
    assert.equal(
      execSyncCalls[0].command,
      `git clone https://github.com/user/repo.git ${expectedDomainDir}`
    );

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-domain: repo'));
    assert.ok(config.includes('active-task: pr-reviews'));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'repo', 'pr-reviews');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('supports --domain with --clone-from for the cloned folder name', async () => {
    cloneFixtures['https://github.com/user/repo.git'] = ['t1'];

    await setActive({
      cloneFrom: 'https://github.com/user/repo.git',
      domainName: 'custom-name',
      taskName: 't1',
    });

    assert.ok(fs.existsSync(path.join(tmpDomainsRoot, 'custom-name', 't1')));
    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-domain: custom-name'));
    assert.ok(config.includes('active-task: t1'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when --clone-from is used without --task', async () => {
    await setActive({
      cloneFrom: 'https://github.com/user/repo.git',
    });

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('with only taskName, uses active domain from config (no prompts)', async () => {
    fs.writeFileSync(
      path.join(tmpCwd, '.ctxlayer', 'config.yaml'),
      'active-domain: domain-alpha\nactive-task: task-one\n'
    );
    await setActive({ taskName: 'task-two' });

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-domain: domain-alpha'));
    assert.ok(config.includes('active-task: task-two'));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'domain-alpha', 'task-two');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when --task is used but config has no resolvable active domain', async () => {
    fs.writeFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'active-task: task-one\n');

    await setActive({ taskName: 'task-two' });

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when selected domain has no tasks', async () => {
    selectQueue = ['empty-domain'];

    await setActive();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when no domains directory exists', async () => {
    const backup = tmpDomainsRoot + '-backup';
    fs.renameSync(tmpDomainsRoot, backup);

    try {
      await setActive();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpDomainsRoot);
    }
  });

  it('exits when no domains found', async () => {
    for (const name of fs.readdirSync(tmpDomainsRoot)) {
      fs.rmSync(path.join(tmpDomainsRoot, name), { recursive: true });
    }

    await setActive();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
