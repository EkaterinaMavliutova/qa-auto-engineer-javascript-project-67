/* eslint no-underscore-dangle: ["error", { "allow": ["__filename", "__dirname"] }] */
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import pluginJs from '@eslint/js';

// mimic CommonJS variables -- not needed if using CommonJS
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: pluginJs.configs.recommended,
});

export default [
  {
    languageOptions: {
      // globals: globals.node,
      globals: {
        ...globals.es2021,
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    ignores: ['node_modules/**', 'jest.config.mjs'],
  },
  {
    files: ['**/*.js', '**/*.test.js'],
    rules: {
      'no-underscore-dangle': [
        'error',
        {
          allow: ['__filename', '__dirname'],
        },
      ],
      'no-console': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        { js: 'always' },
      ],
      ...pluginJs.configs.recommended.rules,
    },
  },
  ...compat.extends('airbnb'),
];
