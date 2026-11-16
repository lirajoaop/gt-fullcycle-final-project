import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // tests/k6 runs in the k6 runtime (not Node), with its own globals and modules.
  { ignores: ['dist/', 'coverage/', 'tests/k6/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: {
      // Express only treats a middleware as an error handler if it has 4 parameters,
      // so the unused `_next` must stay. Names starting with `_` are allowed to be unused.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
