module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: [
      "tsconfig.json",
      "tsconfig.test.json",
      "plugins/ioredis/tsconfig.json",
      "plugins/ioredis/tsconfig.test.json",
      "plugins/mongodb/tsconfig.json",
      "plugins/mongodb/tsconfig.test.json",
      "plugins/mongoose/tsconfig.json",
      "plugins/mongoose/tsconfig.test.json",
    ],
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "interface",
        format: ["PascalCase"],
        custom: {
          regex: "^I[A-Z]",
          match: true,
        },
      },
    ],
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
  },
};
