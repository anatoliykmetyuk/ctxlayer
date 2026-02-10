import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import * as cp from 'child_process';
import { createSandbox, createProject } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpDir, tmpProjectsRoot, tmpCwd, cleanup } = createSandbox();

// ---------------------------------------------------------------------------
// Mocks - execSync no-op so git clone and git init don't run
// ---------------------------------------------------------------------------

let selectQueue = [];
let inputQueue = [];

mock.module('@inquirer/prompts', {
  namedExports: {
    select: async () => selectQueue.shift(),
    input: async () => inputQueue.shift() ?? '',
    confirm: async () => false,
  },
});

mock.module('child_process', {
  namedExports: {
    execSync: () => {},
    spawn: cp.spawn,
    spawnSync: cp.spawnSync,
  },
});

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const { init } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel init', () => {
  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('create from scratch: creates project dir, config, and updates .gitignore', async () => {
    selectQueue = ['scratch'];
    inputQueue = ['my-project'];
    await init();

    const projectDir = path.join(tmpProjectsRoot, 'my-project');
    assert.ok(fs.existsSync(projectDir));

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: my-project'));

    const gitignorePath = path.join(tmpCwd, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath));
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(gitignore.includes('.ctxlayer'));

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('use existing project: creates config and local setup', async () => {
    createProject(tmpProjectsRoot, 'existing-project', ['task-one']);
    selectQueue = ['existing', 'existing-project'];
    await init();

    const configPath = path.join(tmpCwd, '.ctxlayer', 'config.yaml');
    assert.ok(fs.existsSync(configPath));
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes('active-project: existing-project'));

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when project list is empty (use existing)', async () => {
    fs.mkdirSync(tmpProjectsRoot, { recursive: true });
    for (const name of fs.readdirSync(tmpProjectsRoot)) {
      fs.rmSync(path.join(tmpProjectsRoot, name), { recursive: true, force: true });
    }
    selectQueue = ['existing'];

    await init();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when project already exists (create from scratch)', async () => {
    createProject(tmpProjectsRoot, 'my-project', []);
    selectQueue = ['scratch'];
    inputQueue = ['my-project'];

    await init();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when projects root missing (use existing)', async () => {
    const backup = tmpProjectsRoot + '-backup';
    fs.renameSync(tmpProjectsRoot, backup);
    selectQueue = ['existing'];

    try {
      await init();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpProjectsRoot);
    }
  });
});
