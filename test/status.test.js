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

const { status } = await import('../bin/cli.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ctx status', () => {
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

  it('prints active project and task', () => {
    const logCalls = [];
    mock.method(console, 'log', (...args) => {
      logCalls.push(args.join(' '));
    });

    status();

    const output = logCalls.join('\n');
    assert.ok(output.includes(`Active project: ${PROJECT}`));
    assert.ok(output.includes(`Active task:    ${TASK}`));
    assert.equal(process.exit.mock.calls.length, 0);
  });

  it('exits when no config exists', () => {
    fs.rmSync(path.join(tmpCwd, '.ctxlayer'), { recursive: true, force: true });

    status();

    assert.equal(process.exit.mock.calls.length, 1);
    assert.deepStrictEqual(process.exit.mock.calls[0].arguments, [1]);
  });
});
