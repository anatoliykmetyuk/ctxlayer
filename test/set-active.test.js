import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import * as cp from 'child_process';
import { createSandbox, createConfig, createProject } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpProjectsRoot, tmpCwd, cleanup } = createSandbox();

// ---------------------------------------------------------------------------
// Mocks - execSync no-op so git clone and git init don't run
// ---------------------------------------------------------------------------

let selectQueue = [];
let inputQueue = [];

mock.module('@inquirer/prompts', {
  namedExports: {
    select: async () => selectQueue.shift(),
    input: async () => inputQueue.shift() ?? '',
    confirm: async () => false,
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
// Import
// ---------------------------------------------------------------------------

const { setActive } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ctx set active', () => {
  beforeEach(() => {
    process.exit.mock.resetCalls();
    selectQueue = [];
    inputQueue = [];
  });

  after(() => {
    cleanup();
  });

  it('create from scratch: creates project dir, config, task, and updates .gitignore', async () => {
    selectQueue = ['__create_scratch__'];
    inputQueue = ['my-project', 'first-task'];

    await setActive();

    const projectDir = path.join(tmpProjectsRoot, 'my-project');
    assert.ok(fs.existsSync(projectDir));

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: my-project'));
    assert.ok(config.includes('active-task: first-task'));

    const gitignorePath = path.join(tmpCwd, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath));
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(gitignore.includes('.ctxlayer'));

    const taskDir = path.join(projectDir, 'first-task');
    assert.ok(fs.existsSync(taskDir));
    assert.ok(fs.existsSync(path.join(taskDir, 'docs')));
    assert.ok(fs.existsSync(path.join(taskDir, 'context')));

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('use existing project: selects project and task', async () => {
    createProject(tmpProjectsRoot, 'existing-project', ['task-one']);
    selectQueue = ['existing-project', 'task-one'];

    await setActive();

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: existing-project'));
    assert.ok(config.includes('active-task: task-one'));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'existing-project', 'task-one');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('switches to different project and selects task', async () => {
    createProject(tmpProjectsRoot, 'project-a', ['task-a1', 'task-a2']);
    createProject(tmpProjectsRoot, 'project-b', ['task-b1']);
    createConfig(tmpCwd, 'project-a', 'task-a1');
    selectQueue = ['project-b', 'task-b1'];

    await setActive();

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-b'));
    assert.ok(config.includes('active-task: task-b1'));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'project-b', 'task-b1');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('same project: ensures symlink, config unchanged', async () => {
    createProject(tmpProjectsRoot, 'project-a', ['task-a1', 'task-a2']);
    createConfig(tmpCwd, 'project-a', 'task-a1');
    selectQueue = ['project-a', 'task-a1'];

    await setActive();

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-a'));
    assert.ok(config.includes('active-task: task-a1'));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'project-a', 'task-a1');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works without config: prompts for project then task', async () => {
    createProject(tmpProjectsRoot, 'project-a', ['task-a1']);
    selectQueue = ['project-a', 'task-a1'];

    await setActive();

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: project-a'));
    assert.ok(config.includes('active-task: task-a1'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('project with no tasks: prompts to create task inline', async () => {
    createProject(tmpProjectsRoot, 'project-a', ['task-a1']);
    createProject(tmpProjectsRoot, 'project-empty', []);
    createConfig(tmpCwd, 'project-a', 'task-a1');
    selectQueue = ['project-empty'];
    inputQueue = ['first-task'];

    await setActive();

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-empty'));
    assert.ok(config.includes('active-task: first-task'));

    const taskDir = path.join(tmpProjectsRoot, 'project-empty', 'first-task');
    assert.ok(fs.existsSync(taskDir));
    assert.ok(fs.existsSync(path.join(taskDir, 'docs')));
    assert.ok(fs.existsSync(path.join(taskDir, 'context')));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'project-empty', 'first-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when project list empty: create scratch', async () => {
    fs.mkdirSync(tmpProjectsRoot, { recursive: true });
    for (const name of fs.readdirSync(tmpProjectsRoot)) {
      fs.rmSync(path.join(tmpProjectsRoot, name), { recursive: true, force: true });
    }
    selectQueue = ['__create_scratch__'];
    inputQueue = ['new-project', 'initial-task'];

    await setActive();

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: new-project'));
    assert.ok(config.includes('active-task: initial-task'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when project already exists (create from scratch)', async () => {
    createProject(tmpProjectsRoot, 'my-project', []);
    selectQueue = ['__create_scratch__'];
    inputQueue = ['my-project'];

    await setActive();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when projects root missing and use existing selected', async () => {
    createProject(tmpProjectsRoot, 'some-project', ['task-a']);
    createConfig(tmpCwd, 'some-project', 'task-a');
    const backup = tmpProjectsRoot + '-backup';
    fs.renameSync(tmpProjectsRoot, backup);
    selectQueue = ['some-project'];

    try {
      await setActive();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpProjectsRoot);
    }
  });
});
