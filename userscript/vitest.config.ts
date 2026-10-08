import { defineConfig } from 'vitest/config';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
    plugins: [svgr()],
    resolve: {
        // Same aliases as the build, so tests run against Preact.
        alias: {
            'react-dom/client': 'preact/compat/client',
            'react-dom': 'preact/compat',
            'react': 'preact/compat',
            // The CommonJS build would require the real React.
            'react-query': 'react-query/es',
        },
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{js,jsx}'],
        css: false,
        // Bundle these so the React -> Preact aliases apply to them as well.
        server: { deps: { inline: [/react-query/, /react-tooltip/] } },
    },
});
