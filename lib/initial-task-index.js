import fs from 'fs';
import path from 'path';

/**
 * Initial INDEX.md for a new task (see skills/ctxlayer/SKILL.md — Indexing).
 * @param {string} taskName
 * @returns {string}
 */
export function getInitialTaskIndexMarkdown(taskName) {
  return `# ${taskName}

_Summary: add a short description of this task and how to use this context._

## Index

| ID | Filename | Description |
| --- | --- | --- |
`;
}

/**
 * Writes INDEX.md at the task root.
 * @param {string} taskDir
 * @param {string} taskName
 */
export function writeInitialTaskIndex(taskDir, taskName) {
  const filePath = path.join(taskDir, 'INDEX.md');
  fs.writeFileSync(filePath, getInitialTaskIndexMarkdown(taskName), 'utf8');
}
