import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { createSandbox, createConfig, createProject, createTaskSymlink } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpProjectsRoot, tmpCwd, cleanup } = createSandbox();

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let selectQueue = [];
let confirmQueue = [];

mock.module('@inquirer/prompts', {
  namedExports: {
    select: async () => selectQueue.shift(),
    input: async () => '',
    confirm: async () => confirmQueue.shift(),
  },
});

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const { dropProject } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel drop project', () => {
  before(() => {
    createProject(tmpProjectsRoot, 'project-alpha', ['task-one']);
    createConfig(tmpCwd, 'project-alpha', 'task-one');
    createTaskSymlink(tmpCwd, 'project-alpha', 'task-one', tmpProjectsRoot);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('does not remove when user cancels', async () => {
    selectQueue = ['project-alpha'];
    confirmQueue = [false];
    await dropProject();

    const projectDir = path.join(tmpCwd, '.intelligence', 'project-alpha');
    assert.ok(fs.existsSync(projectDir), 'project dir should remain');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('removes project directory when confirmed', async () => {
    selectQueue = ['project-alpha'];
    confirmQueue = [true];
    await dropProject();

    const projectDir = path.join(tmpCwd, '.intelligence', 'project-alpha');
    assert.ok(!fs.existsSync(projectDir), 'project dir should be removed');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no project directories exist', async () => {
    fs.rmSync(path.join(tmpCwd, '.intelligence', 'project-alpha'), { recursive: true, force: true });

    await dropProject();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when no config exists', async () => {
    fs.rmSync(path.join(tmpCwd, '.intelligence'), { recursive: true, force: true });

    await dropProject();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
