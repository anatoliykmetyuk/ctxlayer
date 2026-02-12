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
    createProject(tmpProjectsRoot, 'project-beta', ['task-three']);
    createConfig(tmpCwd, 'project-alpha', 'task-one');
    createTaskSymlink(tmpCwd, 'project-alpha', 'task-one', tmpProjectsRoot);
    createTaskSymlink(tmpCwd, 'project-beta', 'task-three', tmpProjectsRoot);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
    selectQueue = [];
    confirmQueue = [];
  });

  after(() => {
    cleanup();
  });

  it('does not remove when user cancels', async () => {
    selectQueue = ['project-alpha'];
    confirmQueue = [false];
    await dropProject();

    const projectDir = path.join(tmpCwd, '.ctxlayer', 'project-alpha');
    assert.ok(fs.existsSync(projectDir), 'project dir should remain');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('removes project directory when name arg provided and confirmed', async () => {
    confirmQueue = [true];
    await dropProject('project-alpha');

    const projectDir = path.join(tmpCwd, '.ctxlayer', 'project-alpha');
    assert.ok(!fs.existsSync(projectDir), 'project dir should be removed');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('does not remove when name arg provided but user cancels', async () => {
    confirmQueue = [false];
    await dropProject('project-beta');

    const projectDir = path.join(tmpCwd, '.ctxlayer', 'project-beta');
    assert.ok(fs.existsSync(projectDir), 'project dir should remain');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when name arg refers to nonexistent project', async () => {
    await dropProject('nonexistent');

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('removes project directory when confirmed', async () => {
    selectQueue = ['project-beta'];
    confirmQueue = [true];
    await dropProject();

    const projectDir = path.join(tmpCwd, '.ctxlayer', 'project-beta');
    assert.ok(!fs.existsSync(projectDir), 'project dir should be removed');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no project directories exist', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer', 'project-alpha'), { recursive: true, force: true });
    fs.rmSync(path.join(tmpCwd, '.ctxlayer', 'project-beta'), { recursive: true, force: true });

    await dropProject();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when no config exists', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });

    await dropProject();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
