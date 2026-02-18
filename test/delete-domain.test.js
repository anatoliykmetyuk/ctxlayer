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

const { deleteDomain } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ctx delete domain', () => {
  before(() => {
    createDomain(tmpDomainsRoot, 'domain-alpha', ['task-one']);
    createConfig(tmpCwd, 'domain-alpha', 'task-one');
    createTaskSymlink(tmpCwd, 'domain-alpha', 'task-one', tmpDomainsRoot);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('does not delete when user cancels', async () => {
    selectQueue = ['domain-alpha'];
    confirmQueue = [false];
    await deleteDomain();

    const domainDir = path.join(tmpDomainsRoot, 'domain-alpha');
    assert.ok(fs.existsSync(domainDir), 'domain dir should remain');
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('deletes domain from store and local dir when confirmed', async () => {
    selectQueue = ['domain-alpha'];
    confirmQueue = [true];
    await deleteDomain();

    const domainDir = path.join(tmpDomainsRoot, 'domain-alpha');
    assert.ok(!fs.existsSync(domainDir), 'domain dir should be deleted from store');

    const localDomainDir = path.join(tmpCwd, '.ctxlayer', 'domain-alpha');
    assert.ok(!fs.existsSync(localDomainDir), 'local domain dir should be removed');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no domains exist', async () => {
    const backup = tmpDomainsRoot + '-backup';
    fs.renameSync(tmpDomainsRoot, backup);

    try {
      await deleteDomain();
      assert.equal(process.exit.mock.calls.length, 1);
      assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
    } finally {
      fs.renameSync(backup, tmpDomainsRoot);
    }
  });
});
