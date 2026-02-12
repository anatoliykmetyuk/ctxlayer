import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import * as cp from 'child_process';
import { createSandbox, createConfig, createProject } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup -- must happen before importing cli.js
// ---------------------------------------------------------------------------

const { tmpProjectsRoot, tmpCwd, cleanup } = createSandbox();

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
  const PROJECT = 'my-project';

  before(() => {
    createProject(tmpProjectsRoot, PROJECT, []);
    createConfig(tmpCwd, PROJECT);
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

    const taskDir = path.join(tmpProjectsRoot, PROJECT, 'my-task');
    assert.ok(fs.existsSync(taskDir));
    assert.ok(fs.existsSync(path.join(taskDir, 'docs')));
    assert.ok(fs.existsSync(path.join(taskDir, 'context')));

    const linkPath = path.join(tmpCwd, '.ctxlayer', PROJECT, 'my-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(fs.readlinkSync(linkPath), path.resolve(taskDir));

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: my-project'));
    assert.ok(config.includes('active-task: my-task'));

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('happy path with prompt: uses input for task name', async () => {
    confirmQueue = [true];
    inputQueue = ['prompted-task'];
    await newTask();

    const taskDir = path.join(tmpProjectsRoot, PROJECT, 'prompted-task');
    assert.ok(fs.existsSync(taskDir));
    const linkPath = path.join(tmpCwd, '.ctxlayer', PROJECT, 'prompted-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('active project set, answer no: goes to project prompt then creates task', async () => {
    createProject(tmpProjectsRoot, 'project-a', ['task-a1']);
    createProject(tmpProjectsRoot, 'project-b', ['task-b1']);
    createConfig(tmpCwd, 'project-a', 'task-a1');
    confirmQueue = [false];
    selectQueue = ['__select_existing__', 'project-b'];
    await newTask('switched-task');

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-b'));
    assert.ok(config.includes('active-task: switched-task'));
    const taskDir = path.join(tmpProjectsRoot, 'project-b', 'switched-task');
    assert.ok(fs.existsSync(taskDir));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when no config: ensures init, prompts for project then creates task', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    selectQueue = ['__select_existing__', PROJECT];
    await newTask('bootstrap-task');

    const taskDir = path.join(tmpProjectsRoot, PROJECT, 'bootstrap-task');
    assert.ok(fs.existsSync(taskDir));
    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: my-project'));
    assert.ok(config.includes('active-task: bootstrap-task'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when project dir missing: prompts for project then creates task', async () => {
    createConfig(tmpCwd, 'non-existent-project');
    selectQueue = ['__select_existing__', PROJECT];
    await newTask('recovery-task');

    const taskDir = path.join(tmpProjectsRoot, PROJECT, 'recovery-task');
    assert.ok(fs.existsSync(taskDir));
    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: my-project'));
    assert.ok(config.includes('active-task: recovery-task'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('create from scratch: creates project dir, config, task, and updates .gitignore', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    for (const name of fs.readdirSync(tmpProjectsRoot)) {
      fs.rmSync(path.join(tmpProjectsRoot, name), { recursive: true, force: true });
    }
    selectQueue = ['__create_scratch__'];
    inputQueue = ['scratch-project'];

    await newTask('first-task');

    const projectDir = path.join(tmpProjectsRoot, 'scratch-project');
    assert.ok(fs.existsSync(projectDir));
    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: scratch-project'));
    assert.ok(config.includes('active-task: first-task'));
    const gitignorePath = path.join(tmpCwd, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath));
    assert.ok(fs.readFileSync(gitignorePath, 'utf8').includes('.ctxlayer'));
    const taskDir = path.join(projectDir, 'first-task');
    assert.ok(fs.existsSync(taskDir));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('use existing project when not initialized: selects project and creates task', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    createProject(tmpProjectsRoot, 'existing-project', []);
    selectQueue = ['__select_existing__', 'existing-project'];
    await newTask('first-task');

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: existing-project'));
    assert.ok(config.includes('active-task: first-task'));
    const linkPath = path.join(tmpCwd, '.ctxlayer', 'existing-project', 'first-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when project list empty: create from scratch', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    for (const name of fs.readdirSync(tmpProjectsRoot)) {
      fs.rmSync(path.join(tmpProjectsRoot, name), { recursive: true, force: true });
    }
    selectQueue = ['__create_scratch__'];
    inputQueue = ['new-project'];

    await newTask('initial-task');

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: new-project'));
    assert.ok(config.includes('active-task: initial-task'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when task already exists', async () => {
    createConfig(tmpCwd, PROJECT);
    createProject(tmpProjectsRoot, PROJECT, ['existing-task']);
    confirmQueue = [true];

    await newTask('existing-task');

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when task name is empty (from prompt)', async () => {
    createConfig(tmpCwd, PROJECT);
    confirmQueue = [true];
    inputQueue = [''];

    await newTask();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when project already exists (create from scratch)', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    createProject(tmpProjectsRoot, 'dup-project', []);
    selectQueue = ['__create_scratch__'];
    inputQueue = ['dup-project'];

    await newTask('x');

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when projects root missing and select existing', async () => {
    createProject(tmpProjectsRoot, 'some-project', ['task-a']);
    createConfig(tmpCwd, 'some-project', 'task-a');
    const backup = tmpProjectsRoot + '-backup';
    fs.renameSync(tmpProjectsRoot, backup);
    confirmQueue = [false];
    selectQueue = ['__select_existing__', 'some-project'];

    try {
      await newTask('x');
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpProjectsRoot);
    }
  });
});
