import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'node:child_process';
import { createSandbox, createConfig, createDomain } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpDir, tmpCwd, tmpDomainsRoot, cleanup } = createSandbox();

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
  const DOMAIN = 'my-domain';
  const TASK = 'my-task';

  before(() => {
    createDomain(tmpDomainsRoot, DOMAIN, [TASK]);
    createConfig(tmpCwd, DOMAIN, TASK);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('prints active domain and task', () => {
    const logCalls = [];
    mock.method(console, 'log', (...args) => {
      logCalls.push(args.join(' '));
    });

    status();

    const output = logCalls.join('\n');
    assert.ok(output.includes(`Active domain: ${DOMAIN}`));
    assert.ok(output.includes(`Active task:   ${TASK}`));
    assert.ok(output.includes('Domain is not synced to git'), 'expected "Domain is not synced to git" (domain dir exists, no .git)');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('prints reminder when git repo exists but branch is not tracking', () => {
    const domainDir = path.join(tmpDomainsRoot, DOMAIN);
    execSync('git init', { cwd: domainDir });
    fs.writeFileSync(path.join(domainDir, 'README'), 'x');
    execSync('git add README && git commit -m "init"', { cwd: domainDir });

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
    const domainDir = path.join(tmpDomainsRoot, DOMAIN);
    if (!fs.existsSync(path.join(domainDir, '.git'))) {
      execSync('git init', { cwd: domainDir });
      fs.writeFileSync(path.join(domainDir, 'README'), 'x');
      execSync('git add README && git commit -m "init"', { cwd: domainDir });
    }
    execSync('git remote add origin https://github.com/user/my-repo.git', { cwd: domainDir });
    const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: domainDir,
      encoding: 'utf8',
    }).stdout.trim();
    execSync(`git config branch.${branch}.remote origin`, { cwd: domainDir });
    execSync(`git config branch.${branch}.merge refs/heads/${branch}`, { cwd: domainDir });

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
