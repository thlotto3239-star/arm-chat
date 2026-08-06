import nextPlugin from '@next/eslint-plugin-next';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.ts',
      'postcss.config.mjs',
      'next.config.mjs',
      'tailwind.config.ts',
      'playwright-report/**',
      'test-results/**',
      '.github/**',
      'docs/**',
      'stitch_arm_chat_whatsapp_design_system/**',
      'supabase/**',
      'public/**',
      '.agents/**',
    ],
  },
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Block 1: env.ts is OK to access process.env — carve-out
  {
    files: ['src/lib/env.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  // Block 2: All other src files — forbid process.env
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/lib/env.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          message:
            "Direct process.env access is forbidden outside src/lib/env.ts. Import from '@/lib/env' instead.",
          selector: "MemberExpression[object.name='process'][property.name='env']",
        },
      ],
    },
  },
];