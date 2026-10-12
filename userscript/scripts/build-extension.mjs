// Builds the browser extension for one or more targets:
//
//     node scripts/build-extension.mjs [firefox|chrome ...]
//
// Output goes to ../dist/extension/<target>, ready to load as an unpacked
// extension or to zip for a store. Without arguments every target is built.
import { build, mergeConfig, loadConfigFromFile } from 'vite';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const TARGETS = ['firefox', 'chrome'];
// Every entry is a self-contained script, extension scripts can't share chunks
// (content scripts can't be ES modules).
const ENTRIES = {
    content: 'src/extension/content.js',
    background: 'src/extension/background.js',
    options: 'src/extension/options.js',
};

const targets = process.argv.length > 2 ? process.argv.slice(2) : TARGETS;
for (const target of targets) {
    if (!TARGETS.includes(target)) {
        throw new Error(`Unknown target "${target}", expected one of ${TARGETS.join(', ')}.`);
    }
}

// The extension has the same version as the userscript.
const header = readFileSync('src/userscript-header.js', 'utf-8');
const version = header.match(/@version\s+(\S+)/)[1];

const readJson = (file) => JSON.parse(readFileSync(file, 'utf-8'));
const { config: baseConfig } = await loadConfigFromFile(
    { command: 'build', mode: 'development' },
    'vite.extension.config.ts'
);

for (const target of targets) {
    const outDir = resolve('..', 'dist', 'extension', target);
    // Empty the folder but keep it, Firefox's "Reload" of a temporary add-on
    // can lose track of a folder that was deleted and recreated.
    mkdirSync(outDir, { recursive: true });
    readdirSync(outDir).forEach((name) => rmSync(resolve(outDir, name), { recursive: true, force: true }));
    console.log(`\nBuilding the ${target} extension in ${outDir}`);

    for (const [name, entry] of Object.entries(ENTRIES)) {
        await build({
            configFile: false,
            ...mergeConfig(baseConfig, {
                build: {
                    outDir,
                    lib: { entry, name: `cb_${name}`, formats: ['iife'], fileName: () => `${name}.js` },
                    rollupOptions: {
                        output: {
                            inlineDynamicImports: true,
                            // The content script's stylesheet is listed in the manifest.
                            assetFileNames: (asset) =>
                                asset.names?.[0]?.endsWith('.css') ? `${name}.css` : 'assets/[name][extname]',
                        },
                    },
                },
            }),
        });
    }

    const manifest = {
        ...readJson('src/extension/manifest.base.json'),
        ...readJson(`src/extension/manifest.${target}.json`),
        version,
    };
    writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 4) + '\n');
    cpSync('src/extension/icons', resolve(outDir, 'icons'), { recursive: true });
    cpSync('src/extension/options.html', resolve(outDir, 'options.html'));
    cpSync('src/extension/options.css', resolve(outDir, 'options.css'));
}
