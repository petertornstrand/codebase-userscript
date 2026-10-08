import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import { previewPlugin } from './preview/plugin';

// Live preview: serves saved Codebase pages with the userscript source injected
// (hot reloaded) and a mock Codebase API Gateway. See preview/README.md.
export default defineConfig({
    plugins: [svgr(), previewPlugin()],
    root: '.',
    resolve: {
        alias: {
            'react-dom/client': 'preact/compat/client',
            'react-dom': 'preact/compat',
            'react': 'preact/compat',
        },
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
    },
    server: {
        host: true,
        port: 3000,
        strictPort: true,
        // DDEV exposes port 3000 as https://codebase.ddev.site:8125
        hmr: { protocol: 'wss', clientPort: 8125 },
        allowedHosts: true,
    },
});
