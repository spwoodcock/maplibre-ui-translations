// "type": "module" makes every emitted .d.ts an ESM declaration, so TypeScript users on
// node16/nodenext resolution hit TS1479 when they require() the package. TS resolves a
// './x.cjs' specifier to './x.d.cts', so mirroring the declarations is enough.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

function* declarationFiles(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) yield* declarationFiles(path);
        else if (entry.name.endsWith('.d.ts')) yield path;
    }
}

let count = 0;
for (const file of declarationFiles(dist)) {
    const rewritten = readFileSync(file, 'utf8')
        .replace(/(from\s+['"]\.[^'"]*)\.js(['"])/g, '$1.cjs$2')
        // the sibling .d.ts.map does not describe this file
        .replace(/^\/\/# sourceMappingURL=.*$/m, '')
        .trimEnd();
    writeFileSync(file.replace(/\.d\.ts$/, '.d.cts'), `${rewritten}\n`);
    count++;
}

console.log(`emitted ${count} .d.cts declaration file(s)`);
