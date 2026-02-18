import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import * as cp from 'child_process';
import { createSandbox, createConfig, createDomain } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup -- must happen before importing cli.js
// ---------------------------------------------------------------------------

const { tmpDomainsRoot, tmpCwd, cleanup } = createSandbox();

// ---------------------------------------------------------------------------
// Mocks - execSync no-op for git clone / git init
// ---------------------------------------------------------------------------

let selectQueue = [];
let inputQueue = [];
let confirmQueue = [];

mock.module('@inquirer/prompts', {
  namedExports: {
    select: async () => selectQueue.shift(),
    input: async () => inputQueue.shift() ?? '',
    confirm: async () => confirmQueue.shift() ?? true,
  },
});

mock.module('child_process', {
  namedExports: {
    execSync: () => {},
    spawn: cp.spawn,
    spawnSync: cp.spawnSync,
  },
});

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import after mocks are in place
// ---------------------------------------------------------------------------

const { newTask } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ctx new', () => {
  const DOMAIN = 'my-domain';

  before(() => {
    createDomain(tmpDomainsRoot, DOMAIN, []);
    createConfig(tmpCwd, DOMAIN);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
    selectQueue = [];
    inputQueue = [];
    confirmQueue = [];
  });

  after(() => {
    cleanup();
  });

  it('happy path with arg: creates task dir, symlink, and updates config', async () => {
    confirmQueue = [true];
    await newTask('my-task');

    const taskDir = path.join(tmpDomainsRoot, DOMAIN, 'my-task');
    assert.ok(fs.existsSync(taskDir));
    assert.ok(fs.existsSync(path.join(taskDir, 'docs')));
    assert.ok(fs.existsSync(path.join(taskDir, 'data')));

    const linkPath = path.join(tmpCwd, '.ctxlayer', DOMAIN, 'my-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(fs.readlinkSync(linkPath), path.resolve(taskDir));

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-domain: my-domain'));
    assert.ok(config.includes('active-task: my-task'));

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('happy path with prompt: uses input for task name', async () => {
    confirmQueue = [true];
    inputQueue = ['prompted-task'];
    await newTask();

    const taskDir = path.join(tmpDomainsRoot, DOMAIN, 'prompted-task');
    assert.ok(fs.existsSync(taskDir));
    const linkPath = path.join(tmpCwd, '.ctxlayer', DOMAIN, 'prompted-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('active domain set, answer no: goes to domain prompt then creates task', async () => {
    createDomain(tmpDomainsRoot, 'domain-a', ['task-a1']);
    createDomain(tmpDomainsRoot, 'domain-b', ['task-b1']);
    createConfig(tmpCwd, 'domain-a', 'task-a1');
    confirmQueue = [false];
    selectQueue = ['__select_existing__', 'domain-b'];
    await newTask('switched-task');

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-domain: domain-b'));
    assert.ok(config.includes('active-task: switched-task'));
    const taskDir = path.join(tmpDomainsRoot, 'domain-b', 'switched-task');
    assert.ok(fs.existsSync(taskDir));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when no config: ensures init, prompts for domain then creates task', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    selectQueue = ['__select_existing__', DOMAIN];
    await newTask('bootstrap-task');

    const taskDir = path.join(tmpDomainsRoot, DOMAIN, 'bootstrap-task');
    assert.ok(fs.existsSync(taskDir));
    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-domain: my-domain'));
    assert.ok(config.includes('active-task: bootstrap-task'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when domain dir missing: prompts for domain then creates task', async () => {
    createConfig(tmpCwd, 'non-existent-domain');
    selectQueue = ['__select_existing__', DOMAIN];
    await newTask('recovery-task');

    const taskDir = path.join(tmpDomainsRoot, DOMAIN, 'recovery-task');
    assert.ok(fs.existsSync(taskDir));
    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-domain: my-domain'));
    assert.ok(config.includes('active-task: recovery-task'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('create from scratch: creates domain dir, config, task, and updates .gitignore', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    for (const name of fs.readdirSync(tmpDomainsRoot)) {
      fs.rmSync(path.join(tmpDomainsRoot, name), { recursive: true, force: true });
    }
    selectQueue = ['__create_scratch__'];
    inputQueue = ['scratch-domain'];

    await newTask('first-task');

    const domainDir = path.join(tmpDomainsRoot, 'scratch-domain');
    assert.ok(fs.existsSync(domainDir));
    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-domain: scratch-domain'));
    assert.ok(config.includes('active-task: first-task'));
    const gitignorePath = path.join(tmpCwd, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath));
    assert.ok(fs.readFileSync(gitignorePath, 'utf8').includes('.ctxlayer'));
    const taskDir = path.join(domainDir, 'first-task');
    assert.ok(fs.existsSync(taskDir));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('use existing domain when not initialized: selects domain and creates task', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    createDomain(tmpDomainsRoot, 'existing-domain', []);
    selectQueue = ['__select_existing__', 'existing-domain'];
    await newTask('first-task');

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-domain: existing-domain'));
    assert.ok(config.includes('active-task: first-task'));
    const linkPath = path.join(tmpCwd, '.ctxlayer', 'existing-domain', 'first-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when domain list empty: create from scratch', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    for (const name of fs.readdirSync(tmpDomainsRoot)) {
      fs.rmSync(path.join(tmpDomainsRoot, name), { recursive: true, force: true });
    }
    selectQueue = ['__create_scratch__'];
    inputQueue = ['new-domain'];

    await newTask('initial-task');

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-domain: new-domain'));
    assert.ok(config.includes('active-task: initial-task'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when task already exists', async () => {
    createConfig(tmpCwd, DOMAIN);
    createDomain(tmpDomainsRoot, DOMAIN, ['existing-task']);
    confirmQueue = [true];

    await newTask('existing-task');

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when task name is empty (from prompt)', async () => {
    createConfig(tmpCwd, DOMAIN);
    confirmQueue = [true];
    inputQueue = [''];

    await newTask();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when domain already exists (create from scratch)', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    createDomain(tmpDomainsRoot, 'dup-domain', []);
    selectQueue = ['__create_scratch__'];
    inputQueue = ['dup-domain'];

    await newTask('x');

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when domains root missing and select existing', async () => {
    createDomain(tmpDomainsRoot, 'some-domain', ['task-a']);
    createConfig(tmpCwd, 'some-domain', 'task-a');
    const backup = tmpDomainsRoot + '-backup';
    fs.renameSync(tmpDomainsRoot, backup);
    confirmQueue = [false];
    selectQueue = ['__select_existing__', 'some-domain'];

    try {
      await newTask('x');
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpDomainsRoot);
    }
  });
});
