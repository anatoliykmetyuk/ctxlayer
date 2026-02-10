import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Creates a sandboxed environment with temp dirs and env vars.
 * Call before importing cli.js so module-level constants pick up the env vars.
 *
 * @returns {{ tmpDir: string, tmpHome: string, tmpProjectsRoot: string, tmpCwd: string, cleanup: () => void }}
 */
export function createSandbox() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'intel-test-'));
  const tmpHome = path.join(tmpDir, '.ctxlayer');
  const tmpProjectsRoot = path.join(tmpHome, 'projects');
  const tmpCwd = path.join(tmpDir, 'repo');

  process.env.CONTEXT_LAYER_HOME = tmpHome;
  process.env.CONTEXT_LAYER_CWD = tmpCwd;

  return {
    tmpDir,
    tmpHome,
    tmpProjectsRoot,
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
 * @param {string} project - active-project value
 * @param {string} [task] - optional active-task value
 */
export function createConfig(cwd, project, task) {
  const localDir = path.join(cwd, '.ctxlayer');
  fs.mkdirSync(localDir, { recursive: true });
  let content = `active-project: ${project}\n`;
  if (task) {
    content += `active-task: ${task}\n`;
  }
  fs.writeFileSync(path.join(localDir, 'config.yaml'), content);
}

/**
 * Creates a project directory under projectsRoot with optional task subdirs.
 * Each task gets docs/ and context/ subdirs.
 *
 * @param {string} projectsRoot
 * @param {string} name - project name
 * @param {string[]} [tasks] - optional task names
 */
export function createProject(projectsRoot, name, tasks = []) {
  const projDir = path.join(projectsRoot, name);
  fs.mkdirSync(projDir, { recursive: true });
  for (const task of tasks) {
    fs.mkdirSync(path.join(projDir, task, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(projDir, task, 'context'), { recursive: true });
  }
}

/**
 * Creates a symlink at cwd/.ctxlayer/<projectName>/<taskName> pointing to
 * projectsRoot/<projectName>/<taskName>. Mirrors ensureTaskSymlink behavior for test setup.
 *
 * @param {string} cwd - Path to the local repo (e.g. tmpCwd)
 * @param {string} projectName
 * @param {string} taskName
 * @param {string} projectsRoot
 */
export function createTaskSymlink(cwd, projectName, taskName, projectsRoot) {
  const localProjectDir = path.join(cwd, '.ctxlayer', projectName);
  fs.mkdirSync(localProjectDir, { recursive: true });
  const linkPath = path.join(localProjectDir, taskName);
  const target = path.resolve(path.join(projectsRoot, projectName, taskName));
  const type = process.platform === 'win32' ? 'dir' : undefined;
  fs.symlinkSync(target, linkPath, type);
}
