import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createSandbox, createConfig, createDomain, createTaskSymlink } from './helpers.js';

const cliPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'cli.js');

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

    const localDomainDir = path.join(tmpCwd, 'ctxlayer', 'domain-alpha');
    assert.ok(!fs.existsSync(localDomainDir), 'local domain dir should be removed');

    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('supports non-interactive domain deletion with yes', async () => {
    createDomain(tmpDomainsRoot, 'domain-beta', ['task-two']);
    createTaskSymlink(tmpCwd, 'domain-beta', 'task-two', tmpDomainsRoot);

    await deleteDomain({ domainName: 'domain-beta', yes: true });

    const domainDir = path.join(tmpDomainsRoot, 'domain-beta');
    assert.ok(!fs.existsSync(domainDir), 'domain dir should be deleted from store');

    const localDomainDir = path.join(tmpCwd, 'ctxlayer', 'domain-beta');
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

  describe('CLI (subprocess)', () => {
    it('deletes domain from first positional with --yes', () => {
      const name = 'cli-positional-domain';
      createDomain(tmpDomainsRoot, name, ['t1']);
      createTaskSymlink(tmpCwd, name, 't1', tmpDomainsRoot);

      const res = spawnSync(
        process.execPath,
        [cliPath, 'delete', 'domain', name, '--yes'],
        {
          env: { ...process.env },
          cwd: tmpCwd,
          encoding: 'utf8',
        }
      );

      assert.equal(res.status, 0, res.stdout + res.stderr);
      assert.ok(!fs.existsSync(path.join(tmpDomainsRoot, name)));
      const localDomainDir = path.join(tmpCwd, 'ctxlayer', name);
      assert.ok(!fs.existsSync(localDomainDir));
    });

    it('errors when positional domain and --domain disagree', () => {
      createDomain(tmpDomainsRoot, 'cli-domain-a', ['t1']);
      createDomain(tmpDomainsRoot, 'cli-domain-b', ['t1']);
      createTaskSymlink(tmpCwd, 'cli-domain-a', 't1', tmpDomainsRoot);
      createTaskSymlink(tmpCwd, 'cli-domain-b', 't1', tmpDomainsRoot);

      const res = spawnSync(
        process.execPath,
        [
          cliPath,
          'delete',
          'domain',
          'cli-domain-a',
          '--domain',
          'cli-domain-b',
          '--yes',
        ],
        {
          env: { ...process.env },
          cwd: tmpCwd,
          encoding: 'utf8',
        }
      );

      assert.equal(res.status, 1);
      assert.match(res.stderr, /Conflicting domain name provided/);
      assert.ok(fs.existsSync(path.join(tmpDomainsRoot, 'cli-domain-a')));
      assert.ok(fs.existsSync(path.join(tmpDomainsRoot, 'cli-domain-b')));

      fs.rmSync(path.join(tmpDomainsRoot, 'cli-domain-a'), { recursive: true, force: true });
      fs.rmSync(path.join(tmpDomainsRoot, 'cli-domain-b'), { recursive: true, force: true });
      fs.rmSync(path.join(tmpCwd, 'ctxlayer', 'cli-domain-a'), { recursive: true, force: true });
      fs.rmSync(path.join(tmpCwd, 'ctxlayer', 'cli-domain-b'), { recursive: true, force: true });
    });
  });
});
