import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { createSandbox, createConfig, createProject } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup -- must happen before importing cli.js
// ---------------------------------------------------------------------------

const { tmpDir, tmpProjectsRoot, tmpCwd, cleanup } = createSandbox();

// ---------------------------------------------------------------------------
// Mock @inquirer/prompts -- selectQueue and inputQueue
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

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import after mocks are in place
// ---------------------------------------------------------------------------

const { newTask } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel new', () => {
  const PROJECT = 'my-project';

  before(() => {
    createProject(tmpProjectsRoot, PROJECT, []);
    createConfig(tmpCwd, PROJECT);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
    selectQueue = [];
    inputQueue = [];
  });

  after(() => {
    cleanup();
  });

  it('happy path with arg: creates task dir, symlink, and updates config', async () => {
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
    inputQueue = ['prompted-task'];
    await newTask();

    const taskDir = path.join(tmpProjectsRoot, PROJECT, 'prompted-task');
    assert.ok(fs.existsSync(taskDir));
    const linkPath = path.join(tmpCwd, '.ctxlayer', PROJECT, 'prompted-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when no config: prompts for project then creates task', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    selectQueue = [PROJECT];
    inputQueue = ['bootstrap-task'];

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
    selectQueue = [PROJECT];
    inputQueue = ['recovery-task'];

    await newTask('recovery-task');

    const taskDir = path.join(tmpProjectsRoot, PROJECT, 'recovery-task');
    assert.ok(fs.existsSync(taskDir));
    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: my-project'));
    assert.ok(config.includes('active-task: recovery-task'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when task already exists', async () => {
    createConfig(tmpCwd, PROJECT);
    createProject(tmpProjectsRoot, PROJECT, ['existing-task']);

    await newTask('existing-task');

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when task name is empty (from prompt)', async () => {
    createConfig(tmpCwd, PROJECT);
    inputQueue = [''];

    await newTask();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
