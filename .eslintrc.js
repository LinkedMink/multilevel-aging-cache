module.exports = {
    "extends": [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": ["tsconfig.json", "tsconfig.cli.json", "tsconfig.test.json"],
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "@typescript-eslint/interface-name-prefix": [
            "error",
            { 
                "prefixWithI": "always" 
            }
        ],
        "@typescript-eslint/no-unused-vars": "off"
    }
};
