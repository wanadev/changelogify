const {
    defineConfig,
} = require("eslint/config");

const globals = require("globals");

const { rules } = require("./rules.mjs");

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.node,
        },

        ecmaVersion: 12,
        sourceType: "module",
        parserOptions: {},
    },

    rules: {
        ...rules,
        indent: ["error", 4],
        quotes: ["error", "double"],

        "no-console": ["error", {
            allow: ["info", "warn", "error", "trace", "debug", "table"],
        }],

        "max-len": "off",
        "object-curly-newline": "off",
        "prefer-destructuring": "off",
        "no-param-reassign": "off",
        "import/extensions": "off",
        "no-underscore-dangle": "off",
    },
}]);
