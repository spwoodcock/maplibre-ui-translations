// Weblate's cleanup add-on has twice rewritten files under src/ with the wrong contents
// (issue #8), and it stays invisible until someone loads the published bundle.

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const esm = await import(resolve(root, 'dist/maplibre-ui-translations.js'));
const cjs = createRequire(import.meta.url)(resolve(root, 'dist/maplibre-ui-translations.umd.cjs'));

const failures = [];
const fail = (msg) => failures.push(msg);

const keys = Object.keys(esm.en);

const onDisk = readdirSync(resolve(root, 'src/locales'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => f.replace(/\.ts$/, ''));
for (const code of onDisk) {
    if (!(code in esm.maplibreLocales)) {
        fail(`src/locales/${code}.ts exists but is not exported from maplibreLocales`);
    }
}

for (const [code, locale] of Object.entries(esm.maplibreLocales)) {
    const missing = keys.filter((k) => !(k in locale));
    if (missing.length) fail(`locale '${code}' is missing: ${missing.join(', ')}`);
    const extra = Object.keys(locale).filter((k) => !keys.includes(k));
    if (extra.length) fail(`locale '${code}' has unknown keys: ${extra.join(', ')}`);
}

// Catches the kw.ts shape (real strings, wrong language); untranslated and regional-variant copies are legitimate
const baseLanguage = (code) => code.split('-')[0];
const seen = new Map();
for (const [code, locale] of Object.entries(esm.maplibreLocales)) {
    const fingerprint = JSON.stringify(locale);
    if (fingerprint === JSON.stringify(esm.en)) continue;
    const twin = seen.get(fingerprint);
    if (twin && baseLanguage(twin) !== baseLanguage(code)) {
        fail(`locale '${code}' is byte-identical to '${twin}' -- wrong language content?`);
    }
    if (!twin) seen.set(fingerprint, code);
}

if (typeof esm.updateMaplibreLocale !== 'function') fail('ESM build does not export updateMaplibreLocale');
if (typeof cjs.updateMaplibreLocale !== 'function') fail('CJS build does not export updateMaplibreLocale');
if (Object.keys(cjs.maplibreLocales).length !== Object.keys(esm.maplibreLocales).length) {
    fail('ESM and CJS builds export a different set of locales');
}
if (esm.defaultLocale !== esm.en) fail('defaultLocale is not an alias of en');

if (failures.length) {
    console.error(`\n${failures.length} problem(s) found:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
}

console.log(
    `locales OK: ${Object.keys(esm.maplibreLocales).length} locales x ${keys.length} strings, ESM + CJS both load`
);
