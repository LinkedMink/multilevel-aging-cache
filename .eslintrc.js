module.exports = {
  env: {
    node: true,
  },
  ignorePatterns: ['tests/**/*.ts', 'jest.config.ts'],
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['tsconfig.json'],
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
        ],
        //'@typescript-eslint/restrict-template-expressions': "off"
        // '@typescript-eslint/restrict-template-expressions': [
        //   'warn',
        //   {
        //     allowNumber: true,
        //     allowBoolean: true,
        //     allowAny: false,
        //     allowNullish: true,
        //     allowRegExp: true,
        //   },
        // ],
      },
    },
  ],
};
