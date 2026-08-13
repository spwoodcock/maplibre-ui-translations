// Weblate's cleanup add-on has twice rewritten files under src/ with the wrong contents
// (issue #8), and it stays invisible until someone loads the published bundle.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const esm = await import(resolve(root, 'dist/maplibre-ui-translations.js'));
const cjs = createRequire(import.meta.url)(resolve(root, 'dist/maplibre-ui-translations.umd.cjs'));

const failures = [];
const fail = (msg) => failures.push(msg);

const keys = Object.keys(esm.en);
const localesDir = resolve(root, 'src/locales');
const localeFiles = readdirSync(localesDir);

// Anything but JSON in here means the Weblate file format has been changed back to a line-based one
const stray = localeFiles.filter((f) => !f.endsWith('.json'));
if (stray.length) fail(`src/locales holds non-JSON files: ${stray.join(', ')}`);

for (const file of localeFiles.filter((f) => f.endsWith('.json'))) {
    const code = file.replace(/\.json$/, '');
    if (!(code in esm.maplibreLocales)) fail(`src/locales/${file} is missing from maplibreLocales`);
    if (!(code.replace(/-(\w)/g, (_, c) => c.toUpperCase()) in esm)) {
        fail(`locale '${code}' is not a named export`);
    }
    // Braces mean the file was translated as plain text rather than as key/value pairs
    for (const [key, value] of Object.entries(JSON.parse(readFileSync(resolve(localesDir, file))))) {
        if (typeof value !== 'string') fail(`${file} key '${key}' is not a string`);
        else if (/[{}]/.test(key + value)) fail(`${file} key '${key}' holds syntax: ${value}`);
    }
}

// en.json is vendored, so flag any MapLibre release that rewords or adds a UI string
const upstreamFile = resolve(root, 'node_modules/maplibre-gl/src/ui/default_locale.ts');
if (!existsSync(upstreamFile)) {
    console.warn('note: maplibre-gl no longer ships src/ui/default_locale.ts, en.json is unchecked');
} else {
    const upstream = Object.fromEntries(
        [...readFileSync(upstreamFile, 'utf8').matchAll(/^\s*'([^']+)':\s*'(.*)',$/gm)].map(
            ([, key, value]) => [key, value]
        )
    );
    if (Object.keys(upstream).length < 20) fail('could not parse maplibre-gl default_locale.ts');
    for (const [key, value] of Object.entries(upstream)) {
        if (!(key in esm.en)) fail(`en.json is missing upstream string '${key}': ${value}`);
        else if (esm.en[key] !== value) fail(`en.json '${key}' now reads '${value}' upstream`);
    }
    for (const key of keys.filter((k) => !(k in upstream))) {
        fail(`en.json has '${key}', which upstream no longer defines`);
    }
}

// Catches the kw.json shape (real strings, wrong language); untranslated and regional-variant copies are legitimate
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
