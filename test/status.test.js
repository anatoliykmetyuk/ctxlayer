import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'node:child_process';
import { createSandbox, createConfig, createProject } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpDir, tmpCwd, tmpProjectsRoot, cleanup } = createSandbox();

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

mock.module('@inquirer/prompts', {
  namedExports: {
    select: async () => {},
    input: async () => '',
    confirm: async () => false,
  },
});

mock.method(process, 'exit', () => {});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const { status } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ctx status', () => {
  const PROJECT = 'my-project';
  const TASK = 'my-task';

  before(() => {
    createProject(tmpProjectsRoot, PROJECT, [TASK]);
    createConfig(tmpCwd, PROJECT, TASK);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('prints active project and task', () => {
    const logCalls = [];
    mock.method(console, 'log', (...args) => {
      logCalls.push(args.join(' '));
    });

    status();

    const output = logCalls.join('\n');
    assert.ok(output.includes(`Active project: ${PROJECT}`));
    assert.ok(output.includes(`Active task:    ${TASK}`));
    assert.ok(output.includes('Project is not synced to git'), 'expected "Project is not synced to git" (project dir exists, no .git)');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('prints reminder when git repo exists but branch is not tracking', () => {
    const projectDir = path.join(tmpProjectsRoot, PROJECT);
    execSync('git init', { cwd: projectDir });
    fs.writeFileSync(path.join(projectDir, 'README'), 'x');
    execSync('git add README && git commit -m "init"', { cwd: projectDir });

    const logCalls = [];
    mock.method(console, 'log', (...args) => {
      logCalls.push(args.join(' '));
    });

    status();

    const output = logCalls.join('\n');
    assert.ok(output.includes('Push your branch to set up tracking'), output);
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('prints git branch, repo name, and remote URL when tracking', () => {
    const projectDir = path.join(tmpProjectsRoot, PROJECT);
    if (!fs.existsSync(path.join(projectDir, '.git'))) {
      execSync('git init', { cwd: projectDir });
      fs.writeFileSync(path.join(projectDir, 'README'), 'x');
      execSync('git add README && git commit -m "init"', { cwd: projectDir });
    }
    execSync('git remote add origin https://github.com/user/my-repo.git', { cwd: projectDir });
    const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: projectDir,
      encoding: 'utf8',
    }).stdout.trim();
    execSync(`git config branch.${branch}.remote origin`, { cwd: projectDir });
    execSync(`git config branch.${branch}.merge refs/heads/${branch}`, { cwd: projectDir });

    const logCalls = [];
    mock.method(console, 'log', (...args) => {
      logCalls.push(args.join(' '));
    });

    status();

    const output = logCalls.join('\n');
    assert.ok(output.includes(`Git branch: ${branch}`), output);
    assert.ok(output.includes('Repo:       my-repo'), output);
    assert.ok(output.includes('Remote:     https://github.com/user/my-repo.git'), output);
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no config exists', () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });

    status();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
