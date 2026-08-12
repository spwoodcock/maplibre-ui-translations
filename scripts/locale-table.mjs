// Generates the README locale table from src/locales so it cannot drift from what ships.
// --write updates it; no flag checks it (npm test).

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = join(root, 'README.md');
const START = '<!-- locales:start -->';
const END = '<!-- locales:end -->';

const displayName = new Intl.DisplayNames(['en'], { type: 'language' });

function buildTable() {
    const localeDir = join(root, 'src/locales');
    const rows = readdirSync(localeDir)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => f.replace(/\.ts$/, ''))
        .sort()
        .map((code) => {
            const source = readFileSync(join(localeDir, `${code}.ts`), 'utf8');
            const match = source.match(/export const (\w+)\s*=/);
            if (!match) throw new Error(`src/locales/${code}.ts has no 'export const' declaration`);
            const exported = code === 'en' ? '`en` / `defaultLocale`' : `\`${match[1]}\``;
            return `| \`${code}\` | ${displayName.of(code)} | ${exported} |`;
        });

    return ['| Code | Language | Import |', '| --- | --- | --- |', ...rows].join('\n');
}

const readme = readFileSync(readmePath, 'utf8');
const before = readme.indexOf(START);
const after = readme.indexOf(END);
if (before === -1 || after === -1) throw new Error(`README.md is missing ${START} / ${END} markers`);

const updated =
    readme.slice(0, before + START.length) + '\n' + buildTable() + '\n' + readme.slice(after);

if (process.argv.includes('--write')) {
    writeFileSync(readmePath, updated);
    console.log('README locale table updated');
} else if (updated !== readme) {
    console.error('README locale table is out of date -- run: npm run docs:locales');
    process.exit(1);
} else {
    console.log('README locale table is up to date');
}
