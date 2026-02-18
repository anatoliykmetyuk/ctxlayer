import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Creates a sandboxed environment with temp dirs and env vars.
 * Call before importing cli.js so module-level constants pick up the env vars.
 *
 * @returns {{ tmpDir: string, tmpHome: string, tmpDomainsRoot: string, tmpCwd: string, cleanup: () => void }}
 */
export function createSandbox() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctxlayer-test-'));
  const tmpHome = path.join(tmpDir, '.ctxlayer');
  const tmpDomainsRoot = path.join(tmpHome, 'domains');
  const tmpCwd = path.join(tmpDir, 'repo');

  fs.mkdirSync(tmpHome, { recursive: true });
  fs.mkdirSync(tmpDomainsRoot, { recursive: true });
  fs.mkdirSync(tmpCwd, { recursive: true });

  process.env.CONTEXT_LAYER_HOME = tmpHome;
  process.env.CONTEXT_LAYER_CWD = tmpCwd;

  return {
    tmpDir,
    tmpHome,
    tmpDomainsRoot,
    tmpCwd,
    cleanup() {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      delete process.env.CONTEXT_LAYER_HOME;
      delete process.env.CONTEXT_LAYER_CWD;
    },
  };
}

/**
 * Creates .ctxlayer/config.yaml in the given cwd.
 *
 * @param {string} cwd - Path to the local repo (e.g. tmpCwd)
 * @param {string} domain - active-domain value
 * @param {string} [task] - optional active-task value
 */
export function createConfig(cwd, domain, task) {
  const localDir = path.join(cwd, '.ctxlayer');
  fs.mkdirSync(localDir, { recursive: true });
  let content = `active-domain: ${domain}\n`;
  if (task) {
    content += `active-task: ${task}\n`;
  }
  fs.writeFileSync(path.join(localDir, 'config.yaml'), content);
}

/**
 * Creates a domain directory under domainsRoot with optional task subdirs.
 * Each task gets docs/ and data/ subdirs.
 *
 * @param {string} domainsRoot
 * @param {string} name - domain name
 * @param {string[]} [tasks] - optional task names
 */
export function createDomain(domainsRoot, name, tasks = []) {
  const domainDir = path.join(domainsRoot, name);
  fs.mkdirSync(domainDir, { recursive: true });
  for (const task of tasks) {
    fs.mkdirSync(path.join(domainDir, task, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(domainDir, task, 'data'), { recursive: true });
  }
}

/**
 * Creates a symlink at cwd/.ctxlayer/<domainName>/<taskName> pointing to
 * domainsRoot/<domainName>/<taskName>. Mirrors ensureTaskSymlink behavior for test setup.
 *
 * @param {string} cwd - Path to the local repo (e.g. tmpCwd)
 * @param {string} domainName
 * @param {string} taskName
 * @param {string} domainsRoot
 */
export function createTaskSymlink(cwd, domainName, taskName, domainsRoot) {
  const localDomainDir = path.join(cwd, '.ctxlayer', domainName);
  fs.mkdirSync(localDomainDir, { recursive: true });
  const linkPath = path.join(localDomainDir, taskName);
  const target = path.resolve(path.join(domainsRoot, domainName, taskName));
  const type = process.platform === 'win32' ? 'dir' : undefined;
  fs.symlinkSync(target, linkPath, type);
}
