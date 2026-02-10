import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import * as cp from 'child_process';
import { createSandbox, createConfig, createProject } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpProjectsRoot, tmpCwd, cleanup } = createSandbox();

// ---------------------------------------------------------------------------
// Mocks - preserve spawn/spawnSync for inquirer deps, mock execSync
// ---------------------------------------------------------------------------

let execSyncCalls = [];

mock.module('child_process', {
  namedExports: {
    execSync: (...args) => {
      execSyncCalls.push(args);
    },
    spawn: cp.spawn,
    spawnSync: cp.spawnSync,
  },
});

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const { intelGit } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel git', () => {
  const PROJECT = 'my-project';
  const TASK = 'my-task';

  before(() => {
    createProject(tmpProjectsRoot, PROJECT, [TASK]);
    createConfig(tmpCwd, PROJECT, TASK);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
    execSyncCalls = [];
  });

  after(() => {
    cleanup();
  });

  it('runs git with correct cwd and args', () => {
    process.argv = ['node', 'intel', 'git', 'status'];
    intelGit();

    assert.equal(execSyncCalls.length, 1);
    const [cmd, opts] = execSyncCalls[0];
    assert.equal(cmd, 'git status');
    assert.equal(opts.cwd, path.join(tmpProjectsRoot, PROJECT, TASK));
    assert.equal(opts.stdio, 'inherit');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('runs git with no args when only git is passed', () => {
    process.argv = ['node', 'intel', 'git'];
    intelGit();

    assert.equal(execSyncCalls.length, 1);
    const [cmd] = execSyncCalls[0];
    assert.equal(cmd, 'git');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no config exists', () => {
    fs.rmSync(path.join(tmpCwd, '.intelligence'), { recursive: true, force: true });
    process.argv = ['node', 'intel', 'git', 'status'];

    intelGit();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when no active task is set', () => {
    createConfig(tmpCwd, PROJECT); // no active-task
    process.argv = ['node', 'intel', 'git', 'status'];

    intelGit();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when task directory does not exist', () => {
    createConfig(tmpCwd, PROJECT, 'non-existent-task');
    process.argv = ['node', 'intel', 'git', 'status'];

    intelGit();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
