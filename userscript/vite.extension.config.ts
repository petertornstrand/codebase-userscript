// Shared Vite config for the browser extension, see scripts/build-extension.mjs
// which builds each entry (content script, background script, options page)
// for each target browser.
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
    plugins: [svgr()],
    base: './',
    resolve: {
        // Use Preact in place of React, including for react-query and
        // react-tooltip.
        alias: {
            'react-dom/client': 'preact/compat/client',
            'react-dom': 'preact/compat',
            'react': 'preact/compat',
        },
    },
    build: {
        cssCodeSplit: false,
        cssMinify: false,
        emptyOutDir: false,
        minify: false,
        sourcemap: false,
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
    },
});
