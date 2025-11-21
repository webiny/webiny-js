import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/build/',
      '**/.out/',
      '**/*.d.ts',
      'idea.js',
      'scripts'
    ]
  },
];
