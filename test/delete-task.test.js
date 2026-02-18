import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { createSandbox, createConfig, createDomain, createTaskSymlink } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpDomainsRoot, tmpCwd, cleanup } = createSandbox();

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

describe('ctx delete task', () => {
  before(() => {
    createDomain(tmpDomainsRoot, 'domain-alpha', ['task-one', 'task-two']);
    createConfig(tmpCwd, 'domain-alpha', 'task-one');
    createTaskSymlink(tmpCwd, 'domain-alpha', 'task-one', tmpDomainsRoot);
    createTaskSymlink(tmpCwd, 'domain-alpha', 'task-two', tmpDomainsRoot);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('does not delete when user cancels', async () => {
    selectQueue = ['domain-alpha', 'task-one'];
    confirmQueue = [false];
    await deleteTask();

    const taskDir = path.join(tmpDomainsRoot, 'domain-alpha', 'task-one');
    assert.ok(fs.existsSync(taskDir), 'task dir should remain');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('deletes task dir and symlink when confirmed', async () => {
    selectQueue = ['domain-alpha', 'task-two'];
    confirmQueue = [true];
    await deleteTask();

    const taskDir = path.join(tmpDomainsRoot, 'domain-alpha', 'task-two');
    assert.ok(!fs.existsSync(taskDir), 'task dir should be deleted');

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'domain-alpha', 'task-two');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');

    const taskOneDir = path.join(tmpDomainsRoot, 'domain-alpha', 'task-one');
    assert.ok(fs.existsSync(taskOneDir), 'other task should remain');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('removes task dir and symlink when last task in domain is deleted', async () => {
    createDomain(tmpDomainsRoot, 'domain-solo', ['only-task']);
    createTaskSymlink(tmpCwd, 'domain-solo', 'only-task', tmpDomainsRoot);

    selectQueue = ['domain-solo', 'only-task'];
    confirmQueue = [true];
    await deleteTask();

    const taskDir = path.join(tmpDomainsRoot, 'domain-solo', 'only-task');
    assert.ok(!fs.existsSync(taskDir), 'task dir should be deleted');

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'domain-solo', 'only-task');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no domains exist', async () => {
    const backup = tmpDomainsRoot + '-backup';
    fs.renameSync(tmpDomainsRoot, backup);

    try {
      await deleteTask();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpDomainsRoot);
    }
  });
});
