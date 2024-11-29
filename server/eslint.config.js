import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import nodePlugin from 'eslint-plugin-node';

const compat = new FlatCompat();

export default [
  {
    files: ['**/*.js', '**/*.ts'],
    ignores: ['node_modules/**', 'dist/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      prettier: prettierPlugin,
      node: nodePlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'node/no-missing-import': 'off',
    },
  },
  ...compat.extends('plugin:prettier/recommended'),
];
