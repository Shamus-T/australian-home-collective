import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const revision = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA
  || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/i.test(revision)) throw new Error('Invalid deployment revision.');
fs.writeFileSync('dist/indexnow-revision.json', JSON.stringify({ revision }) + '\n');
