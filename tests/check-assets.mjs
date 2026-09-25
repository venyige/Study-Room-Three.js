// Fails if an asset referenced by the demo is missing or a model is not valid JSON.
// Run: npm run check:assets
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const errors = [];

// Every quoted "assets/..." path in the source must exist.
for (const file of readdirSync(join(root, 'src'), { recursive: true })) {
    if (!file.endsWith('.js')) continue;
    const source = readFileSync(join(root, 'src', file), 'utf8');
    for (const [, path] of source.matchAll(/['"](assets\/[^'"]+)['"]/g)) {
        if (!existsSync(join(root, path))) errors.push(`src/${file}: missing ${path}`);
    }
}

// Every model must parse and look like a three.js legacy JSON geometry.
const modelsDir = join(root, 'assets/models');
for (const file of readdirSync(modelsDir, { recursive: true })) {
    if (!file.endsWith('.json')) continue;
    try {
        const model = JSON.parse(readFileSync(join(modelsDir, file), 'utf8'));
        if (!Array.isArray(model.vertices) || !Array.isArray(model.faces)) {
            errors.push(`assets/models/${file}: no vertices/faces arrays`);
        }
    } catch (error) {
        errors.push(`assets/models/${file}: ${error.message}`);
    }
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}
console.log('assets ok');
