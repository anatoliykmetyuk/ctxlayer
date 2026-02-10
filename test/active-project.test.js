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
    confirm: async () => false,
  },
});

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const { activeProject } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel active project', () => {
  before(() => {
    createProject(tmpProjectsRoot, 'project-a', ['task-a1', 'task-a2']);
    createProject(tmpProjectsRoot, 'project-b', ['task-b1']);
    createProject(tmpProjectsRoot, 'project-empty', []);
    createConfig(tmpCwd, 'project-a', 'task-a1');
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('switches to different project and selects task', async () => {
    selectQueue = ['project-b', 'task-b1'];
    await activeProject();

    const config = fs.readFileSync(path.join(tmpCwd, '.intelligence', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-b'));
    assert.ok(config.includes('active-task: task-b1'));

    const linkPath = path.join(tmpCwd, '.intelligence', 'project-b', 'task-b1');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('same project: ensures symlink, config unchanged', async () => {
    createConfig(tmpCwd, 'project-a', 'task-a1');
    selectQueue = ['project-a'];
    await activeProject();

    const config = fs.readFileSync(path.join(tmpCwd, '.intelligence', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-a'));
    assert.ok(config.includes('active-task: task-a1'));

    const linkPath = path.join(tmpCwd, '.intelligence', 'project-a', 'task-a1');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no config exists', async () => {
    fs.rmSync(path.join(tmpCwd, '.intelligence'), { recursive: true, force: true });

    await activeProject();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when projects root does not exist', async () => {
    const backup = tmpProjectsRoot + '-backup';
    fs.renameSync(tmpProjectsRoot, backup);

    try {
      await activeProject();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpProjectsRoot);
    }
  });

  it('exits when project list is empty', async () => {
    const backup = tmpProjectsRoot + '-backup';
    fs.renameSync(tmpProjectsRoot, backup);
    fs.mkdirSync(tmpProjectsRoot, { recursive: true });

    try {
      await activeProject();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.rmSync(tmpProjectsRoot, { recursive: true, force: true });
      fs.renameSync(backup, tmpProjectsRoot);
    }
  });

  it('switches to project with no tasks: updates config, no task symlink', async () => {
    createConfig(tmpCwd, 'project-a', 'task-a1');
    selectQueue = ['project-empty'];
    await activeProject();

    const config = fs.readFileSync(path.join(tmpCwd, '.intelligence', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-empty'));
    assert.ok(!config.includes('active-task: task-a1'));

    const projectDir = path.join(tmpCwd, '.intelligence', 'project-empty');
    assert.ok(!fs.existsSync(projectDir) || fs.readdirSync(projectDir).length === 0);
    assert.equal(process.exit.mock.calls.length, 0);
  });
});
