module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
    "prettier/@typescript-eslint",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.cli.json", "tsconfig.test.json"],
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/interface-name-prefix": [
      "error",
      {
        prefixWithI: "always",
      },
    ],
    "@typescript-eslint/no-unused-vars": "off",
  },
  overrides: [
    {
      files: ["*.js"],
      processor: "espree",
    },
  ],
};
