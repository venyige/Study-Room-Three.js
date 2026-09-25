import js from '@eslint/js';
import globals from 'globals';

export default [
    { ignores: ['vendor/**', 'node_modules/**', 'test-results/**'] },
    js.configs.recommended,
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.browser, THREE: 'readonly', dat: 'readonly' },
        },
    },
    {
        files: ['tests/**/*.mjs', '*.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node },
        },
    },
];
