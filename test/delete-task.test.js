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

const { deleteTask } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel delete task', () => {
  before(() => {
    createProject(tmpProjectsRoot, 'project-alpha', ['task-one', 'task-two']);
    createConfig(tmpCwd, 'project-alpha', 'task-one');
    createTaskSymlink(tmpCwd, 'project-alpha', 'task-one', tmpProjectsRoot);
    createTaskSymlink(tmpCwd, 'project-alpha', 'task-two', tmpProjectsRoot);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('does not delete when user cancels', async () => {
    selectQueue = ['project-alpha', 'task-one'];
    confirmQueue = [false];
    await deleteTask();

    const taskDir = path.join(tmpProjectsRoot, 'project-alpha', 'task-one');
    assert.ok(fs.existsSync(taskDir), 'task dir should remain');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('deletes task dir and symlink when confirmed', async () => {
    selectQueue = ['project-alpha', 'task-two'];
    confirmQueue = [true];
    await deleteTask();

    const taskDir = path.join(tmpProjectsRoot, 'project-alpha', 'task-two');
    assert.ok(!fs.existsSync(taskDir), 'task dir should be deleted');

    const linkPath = path.join(tmpCwd, '.intelligence', 'project-alpha', 'task-two');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');

    const taskOneDir = path.join(tmpProjectsRoot, 'project-alpha', 'task-one');
    assert.ok(fs.existsSync(taskOneDir), 'other task should remain');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('removes task dir and symlink when last task in project is deleted', async () => {
    createProject(tmpProjectsRoot, 'project-solo', ['only-task']);
    createTaskSymlink(tmpCwd, 'project-solo', 'only-task', tmpProjectsRoot);

    selectQueue = ['project-solo', 'only-task'];
    confirmQueue = [true];
    await deleteTask();

    const taskDir = path.join(tmpProjectsRoot, 'project-solo', 'only-task');
    assert.ok(!fs.existsSync(taskDir), 'task dir should be deleted');

    const linkPath = path.join(tmpCwd, '.intelligence', 'project-solo', 'only-task');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no projects exist', async () => {
    const backup = tmpProjectsRoot + '-backup';
    fs.renameSync(tmpProjectsRoot, backup);

    try {
      await deleteTask();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpProjectsRoot);
    }
  });
});
