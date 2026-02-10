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

mock.module('@inquirer/prompts', {
  namedExports: {
    select: async () => selectQueue.shift(),
    input: async () => '',
    confirm: async () => false,
  },
});

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const { dropTask } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel drop task', () => {
  before(() => {
    createProject(tmpProjectsRoot, 'project-alpha', ['task-one', 'task-two']);
    createProject(tmpProjectsRoot, 'project-beta', ['task-three']);
    createConfig(tmpCwd, 'project-alpha', 'task-one');
    createTaskSymlink(tmpCwd, 'project-alpha', 'task-one', tmpProjectsRoot);
    createTaskSymlink(tmpCwd, 'project-alpha', 'task-two', tmpProjectsRoot);
    createTaskSymlink(tmpCwd, 'project-beta', 'task-three', tmpProjectsRoot);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('uses task name arg when provided (active project)', async () => {
    await dropTask('task-two');

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'project-alpha', 'task-two');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('removes symlink for selected task', async () => {
    selectQueue = ['project-alpha', 'task-one'];
    await dropTask();

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'project-alpha', 'task-one');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');

    const projectDir = path.join(tmpCwd, '.ctxlayer', 'project-alpha');
    assert.ok(!fs.existsSync(projectDir), 'empty project dir should be removed');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('removes empty project directory when last task is dropped', async () => {
    selectQueue = ['project-beta', 'task-three'];
    await dropTask();

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'project-beta', 'task-three');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');

    const projectDir = path.join(tmpCwd, '.ctxlayer', 'project-beta');
    assert.ok(!fs.existsSync(projectDir), 'empty project dir should be removed');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no project directories exist', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer', 'project-alpha'), { recursive: true, force: true });
    fs.rmSync(path.join(tmpCwd, '.ctxlayer', 'project-beta'), { recursive: true, force: true });

    await dropTask();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when no config exists', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });

    await dropTask();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
