// @ts-check
const globals = require('globals');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const eslintPluginNoRelativePaths = require('eslint-plugin-no-relative-import-paths');
const eslintPluginQuery = require('@tanstack/eslint-plugin-query');
const eslintPluginPerfectionist = require('eslint-plugin-perfectionist');
const eslintPluginRegexp = require('eslint-plugin-regexp');

module.exports = tseslint.config(
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  {
    files: ['**/*.ts'],
    plugins: {
      'no-relative-import-paths': eslintPluginNoRelativePaths,
      perfectionist: eslintPluginPerfectionist,
      regexp: eslintPluginRegexp,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
      ...eslintPluginQuery.configs['flat/recommended'],
      eslintPluginRegexp.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          prefix: '~',
          rootDir: './src/app',
        },
      ],
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true,
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/no-async-lifecycle-method': ['error'],
      '@angular-eslint/no-conflicting-lifecycle': ['error'],
      '@angular-eslint/prefer-on-push-component-change-detection': ['error'],
      '@angular-eslint/prefer-output-readonly': ['error'],
      '@angular-eslint/prefer-standalone': ['error'],
      '@angular-eslint/sort-lifecycle-methods': ['error'],
      '@angular-eslint/use-component-selector': ['error'],
      '@angular-eslint/use-lifecycle-interface': ['error'],
      'perfectionist/sort-array-includes': ['error'],
      'perfectionist/sort-enums': ['error'],
      'perfectionist/sort-intersection-types': ['error'],
      'perfectionist/sort-union-types': ['error'],
    },
  },
  {
    files: ['src/app/**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      eslintPluginPrettierRecommended,
    ],
    rules: {
      '@angular-eslint/template/i18n': [
        'error',
        {
          checkId: false,
          ignoreAttributes: [
            'app-query-table[localStorageKey]',
            'data-testid',
            'field',
            'img[ngSrc]',
            'inputStyleClass',
            'ng-container[slot]',
            'p-button[icon]',
            'p-button[iconPos]',
            'p-columnFilter[display]',
            'p-contextMenu[appendTo]',
            'p-iconField[iconPosition]',
            'p-sidebar[position]',
            'p-table[stateKey]',
            'p-table[stateStorage]',
            'styleClass',
            'th[pSortableColumn]',
            'app-colored-chip[variant]',
            'app-metric-tile[chipIcon]',
            'app-metric-tile[chipVariant]',
            'iframe[referrerpolicy]',
            'iframe[loading]',
            'iframe[sandbox]',
          ],
        },
      ],
      'prettier/prettier': [
        'error',
        {
          parser: 'angular',
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    extends: [eslintPluginPrettierRecommended],
    rules: {},
  },
);
