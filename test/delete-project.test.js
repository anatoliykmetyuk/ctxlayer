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

const { deleteProject } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel delete project', () => {
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

  it('does not delete when user cancels', async () => {
    selectQueue = ['project-alpha'];
    confirmQueue = [false];
    await deleteProject();

    const projectDir = path.join(tmpProjectsRoot, 'project-alpha');
    assert.ok(fs.existsSync(projectDir), 'project dir should remain');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('deletes project from store and local dir when confirmed', async () => {
    selectQueue = ['project-alpha'];
    confirmQueue = [true];
    await deleteProject();

    const projectDir = path.join(tmpProjectsRoot, 'project-alpha');
    assert.ok(!fs.existsSync(projectDir), 'project dir should be deleted from store');

    const localProjectDir = path.join(tmpCwd, '.ctxlayer', 'project-alpha');
    assert.ok(!fs.existsSync(localProjectDir), 'local project dir should be removed');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no projects exist', async () => {
    const backup = tmpProjectsRoot + '-backup';
    fs.renameSync(tmpProjectsRoot, backup);

    try {
      await deleteProject();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpProjectsRoot);
    }
  });
});
