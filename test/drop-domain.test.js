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

const { dropDomain } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ctx drop domain', () => {
  before(() => {
    createDomain(tmpDomainsRoot, 'domain-alpha', ['task-one']);
    createDomain(tmpDomainsRoot, 'domain-beta', ['task-three']);
    createConfig(tmpCwd, 'domain-alpha', 'task-one');
    createTaskSymlink(tmpCwd, 'domain-alpha', 'task-one', tmpDomainsRoot);
    createTaskSymlink(tmpCwd, 'domain-beta', 'task-three', tmpDomainsRoot);
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
    selectQueue = ['domain-alpha'];
    confirmQueue = [false];
    await dropDomain();

    const domainDir = path.join(tmpCwd, '.ctxlayer', 'domain-alpha');
    assert.ok(fs.existsSync(domainDir), 'domain dir should remain');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('removes domain directory when name arg provided and confirmed', async () => {
    confirmQueue = [true];
    await dropDomain('domain-alpha');

    const domainDir = path.join(tmpCwd, '.ctxlayer', 'domain-alpha');
    assert.ok(!fs.existsSync(domainDir), 'domain dir should be removed');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('does not remove when name arg provided but user cancels', async () => {
    confirmQueue = [false];
    await dropDomain('domain-beta');

    const domainDir = path.join(tmpCwd, '.ctxlayer', 'domain-beta');
    assert.ok(fs.existsSync(domainDir), 'domain dir should remain');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when name arg refers to nonexistent domain', async () => {
    await dropDomain('nonexistent');

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('removes domain directory when confirmed', async () => {
    selectQueue = ['domain-beta'];
    confirmQueue = [true];
    await dropDomain();

    const domainDir = path.join(tmpCwd, '.ctxlayer', 'domain-beta');
    assert.ok(!fs.existsSync(domainDir), 'domain dir should be removed');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no domain directories exist', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer', 'domain-alpha'), { recursive: true, force: true });
    fs.rmSync(path.join(tmpCwd, '.ctxlayer', 'domain-beta'), { recursive: true, force: true });

    await dropDomain();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });

  it('exits when no config exists', async () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });

    await dropDomain();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
