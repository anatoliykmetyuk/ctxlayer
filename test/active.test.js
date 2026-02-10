import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { createSandbox, createConfig } from './helpers.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const { tmpDir, tmpCwd, cleanup } = createSandbox();

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

const { activeStatus } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intel active', () => {
  const PROJECT = 'my-project';
  const TASK = 'my-task';

  before(() => {
    createConfig(tmpCwd, PROJECT, TASK);
  });

  beforeEach(() => {
    process.exit.mock.resetCalls();
  });

  after(() => {
    cleanup();
  });

  it('prints active project and task with hints', () => {
    const logCalls = [];
    mock.method(console, 'log', (...args) => {
      logCalls.push(args.join(' '));
    });

    activeStatus();

    const output = logCalls.join('\n');
    assert.ok(output.includes(`Active project: ${PROJECT}`));
    assert.ok(output.includes(`Active task:    ${TASK}`));
    assert.ok(output.includes('intel active project'));
    assert.ok(output.includes('intel active task'));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no config exists', () => {
    fs.rmSync(path.join(tmpCwd, '.intelligence'), { recursive: true, force: true });

    activeStatus();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
