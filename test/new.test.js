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

    const linkPath = path.join(tmpCwd, '.intelligence', PROJECT, 'my-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(fs.readlinkSync(linkPath), path.resolve(taskDir));

    const config = fs.readFileSync(path.join(tmpCwd, '.intelligence', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: my-project'));
    assert.ok(config.includes('active-task: my-task'));

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('happy path with prompt: uses input for task name', async () => {
    inputQueue = ['prompted-task'];
    await newTask();

    const taskDir = path.join(tmpProjectsRoot, PROJECT, 'prompted-task');
    assert.ok(fs.existsSync(taskDir));
    const linkPath = path.join(tmpCwd, '.intelligence', PROJECT, 'prompted-task');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no config exists', async () => {
    fs.rmSync(path.join(tmpCwd, '.intelligence'), { recursive: true, force: true });

    await newTask('x');

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when project dir is missing', async () => {
    createConfig(tmpCwd, 'non-existent-project');

    await newTask('x');

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
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
