import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------------------------------------------------------------------------
// Sandbox setup -- must happen before importing cli.js so module-level
// constants (intelligenceHome, cwd, projectsRoot) pick up the env vars.
// ---------------------------------------------------------------------------

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'intel-test-'));
const tmpHome = path.join(tmpDir, '.ctxlayer');
const tmpProjectsRoot = path.join(tmpHome, 'projects');
const tmpCwd = path.join(tmpDir, 'repo');

process.env.CONTEXT_LAYER_HOME = tmpHome;
process.env.CONTEXT_LAYER_CWD = tmpCwd;

// ---------------------------------------------------------------------------
// Mock @inquirer/prompts -- responses are configurable per test via selectQueue
// ---------------------------------------------------------------------------

let selectQueue = [];

mock.module('@inquirer/prompts', {
  namedExports: {
    select: async () => selectQueue.shift(),
    input: async () => '',
    confirm: async () => false,
  },
});

// Prevent process.exit from terminating the test runner
mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import the function under test (after env vars and mocks are in place)
// ---------------------------------------------------------------------------

const { importTask } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel import', () => {
  before(() => {
    // Populate the global store with projects and tasks
    const fixtures = {
      'project-alpha': ['task-one', 'task-two'],
      'project-beta': ['task-three'],
      'empty-project': [],
    };

    for (const [project, tasks] of Object.entries(fixtures)) {
      const projDir = path.join(tmpProjectsRoot, project);
      fs.mkdirSync(projDir, { recursive: true });
      for (const task of tasks) {
        fs.mkdirSync(path.join(projDir, task, 'docs'), { recursive: true });
        fs.mkdirSync(path.join(projDir, task, 'context'), { recursive: true });
      }
    }

    // Create local .ctxlayer/ with a valid config
    const localDir = path.join(tmpCwd, '.ctxlayer');
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(
      path.join(localDir, 'config.yaml'),
      'active-project: project-alpha\nactive-task: task-one\n'
    );
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
    selectQueue = [];
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.CONTEXT_LAYER_HOME;
    delete process.env.CONTEXT_LAYER_CWD;
  });

  it('creates a symlink for the selected task', async () => {
    selectQueue = ['project-beta', 'task-three'];
    await importTask();

    const linkPath = path.join(
      tmpCwd, '.ctxlayer', 'project-beta', 'task-three'
    );
    const stat = fs.lstatSync(linkPath);
    assert.ok(stat.isSymbolicLink(), 'expected a symbolic link');

    const target = fs.readlinkSync(linkPath);
    const expected = path.resolve(
      path.join(tmpProjectsRoot, 'project-beta', 'task-three')
    );
    assert.equal(target, expected);

    assert.equal(process.exit.mock.calls.length, 0, 'should not call process.exit');
  });

  it('is idempotent when the symlink already exists', async () => {
    selectQueue = ['project-beta', 'task-three'];
    await importTask();

    const linkPath = path.join(
      tmpCwd, '.ctxlayer', 'project-beta', 'task-three'
    );
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('returns early when the project has no tasks', async () => {
    selectQueue = ['empty-project'];
    await importTask();

    const dirPath = path.join(tmpCwd, '.ctxlayer', 'empty-project');
    assert.ok(
      !fs.existsSync(dirPath),
      'should not create directory for taskless project'
    );
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits with error when no projects directory exists', async () => {
    const backup = tmpProjectsRoot + '-backup';
    fs.renameSync(tmpProjectsRoot, backup);

    try {
      await importTask();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      // Restore so after() cleanup works
      fs.renameSync(backup, tmpProjectsRoot);
    }
  });

  it('works when uninitialized: creates workspace and sets imported as active', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });
    selectQueue = ['project-beta', 'task-three'];

    await importTask();

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: project-beta'));
    assert.ok(config.includes('active-task: task-three'));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'project-beta', 'task-three');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when config has empty active-project: sets imported as active', async () => {
    const localDir = path.join(tmpCwd, '.ctxlayer');
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(path.join(localDir, 'config.yaml'), '');
    selectQueue = ['project-alpha', 'task-one'];

    await importTask();

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-alpha'));
    assert.ok(config.includes('active-task: task-one'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('works when config has empty active-task: sets imported as active', async () => {
    const localDir = path.join(tmpCwd, '.ctxlayer');
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(path.join(localDir, 'config.yaml'), 'active-project: project-alpha\n');
    selectQueue = ['project-beta', 'task-three'];

    await importTask();

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-beta'));
    assert.ok(config.includes('active-task: task-three'));
    assert.equal(process.exit.mock.calls.length, 0);
  });
});
