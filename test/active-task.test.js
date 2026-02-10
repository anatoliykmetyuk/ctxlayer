import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { createSandbox, createConfig, createProject } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpDir, tmpProjectsRoot, tmpCwd, cleanup } = createSandbox();

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let selectQueue = [];

mock.module('@inquirer/prompts', {
  namedExports: {
    select: async () => selectQueue.shift(),
    input: async () => '',
  },
});

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const { activeTask } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel active task', () => {
  const PROJECT = 'my-project';

  before(() => {
    createProject(tmpProjectsRoot, PROJECT, ['task-one', 'task-two']);
    createConfig(tmpCwd, PROJECT, 'task-one');
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('selects task and creates symlink', async () => {
    selectQueue = ['task-two'];
    await activeTask();

    const config = fs.readFileSync(path.join(tmpCwd, '.intelligence', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-task: task-two'));

    const linkPath = path.join(tmpCwd, '.intelligence', PROJECT, 'task-two');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(fs.readlinkSync(linkPath), path.resolve(path.join(tmpProjectsRoot, PROJECT, 'task-two')));

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no config exists', async () => {
    fs.rmSync(path.join(tmpCwd, '.intelligence'), { recursive: true, force: true });

    await activeTask();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when project dir is missing', async () => {
    createConfig(tmpCwd, 'non-existent-project');
    fs.rmSync(path.join(tmpProjectsRoot, PROJECT), { recursive: true, force: true });

    await activeTask();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('returns early when project has no tasks', async () => {
    createProject(tmpProjectsRoot, 'empty-project', []);
    createConfig(tmpCwd, 'empty-project');
    selectQueue = [];

    await activeTask();

    assert.equal(process.exit.mock.calls.length, 0);
  });
});
