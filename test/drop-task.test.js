import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { createSandbox, createConfig, createDomain, createTaskSymlink } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpDomainsRoot, tmpCwd, cleanup } = createSandbox();

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

describe('ctx drop task', () => {
  before(() => {
    createDomain(tmpDomainsRoot, 'domain-alpha', ['task-one', 'task-two']);
    createDomain(tmpDomainsRoot, 'domain-beta', ['task-three']);
    createConfig(tmpCwd, 'domain-alpha', 'task-one');
    createTaskSymlink(tmpCwd, 'domain-alpha', 'task-one', tmpDomainsRoot);
    createTaskSymlink(tmpCwd, 'domain-alpha', 'task-two', tmpDomainsRoot);
    createTaskSymlink(tmpCwd, 'domain-beta', 'task-three', tmpDomainsRoot);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('uses task name arg when provided (active domain)', async () => {
    await dropTask('task-two');

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'domain-alpha', 'task-two');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('removes symlink for selected task', async () => {
    selectQueue = ['domain-alpha', 'task-one'];
    await dropTask();

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'domain-alpha', 'task-one');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');

    const domainDir = path.join(tmpCwd, '.ctxlayer', 'domain-alpha');
    assert.ok(!fs.existsSync(domainDir), 'empty domain dir should be removed');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('removes empty domain directory when last task is dropped', async () => {
    selectQueue = ['domain-beta', 'task-three'];
    await dropTask();

    const linkPath = path.join(tmpCwd, '.ctxlayer', 'domain-beta', 'task-three');
    assert.ok(!fs.existsSync(linkPath), 'symlink should be removed');

    const domainDir = path.join(tmpCwd, '.ctxlayer', 'domain-beta');
    assert.ok(!fs.existsSync(domainDir), 'empty domain dir should be removed');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no domain directories exist', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer', 'domain-alpha'), { recursive: true, force: true });
    fs.rmSync(path.join(tmpCwd, '.ctxlayer', 'domain-beta'), { recursive: true, force: true });

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
