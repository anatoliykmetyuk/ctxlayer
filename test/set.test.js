import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'intel-test-'));
const tmpHome = path.join(tmpDir, '.ctxlayer');
const tmpProjectsRoot = path.join(tmpHome, 'projects');
const tmpCwd = path.join(tmpDir, 'repo');

process.env.CONTEXT_LAYER_HOME = tmpHome;
process.env.CONTEXT_LAYER_CWD = tmpCwd;

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

const { setActive } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ctx set', () => {
  before(() => {
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
        fs.mkdirSync(path.join(projDir, task, 'data'), { recursive: true });
      }
    }

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

  it('sets active project and task and prepares workspace (config + symlink)', async () => {
    selectQueue = ['project-beta', 'task-three'];
    await setActive();

    const config = fs.readFileSync(path.join(tmpCwd, '.ctxlayer', 'config.yaml'), 'utf8');
    assert.ok(config.includes('active-project: project-beta'));
    assert.ok(config.includes('active-task: task-three'));

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'project-beta', 'task-three');
    assert.ok(fs.lstatSync(linkPath).isSymbolicLink());
    const target = fs.readlinkSync(linkPath);
    assert.equal(target, path.resolve(path.join(tmpProjectsRoot, 'project-beta', 'task-three')));

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when selected project has no tasks', async () => {
    selectQueue = ['empty-project'];

    await setActive();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when no projects directory exists', async () => {
    const backup = tmpProjectsRoot + '-backup';
    fs.renameSync(tmpProjectsRoot, backup);

    try {
      await setActive();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpProjectsRoot);
    }
  });

  it('exits when no projects found', async () => {
    for (const name of fs.readdirSync(tmpProjectsRoot)) {
      fs.rmSync(path.join(tmpProjectsRoot, name), { recursive: true });
    }

    await setActive();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
