module.exports = {
    env: {
        es2021: true,
        node: true,
    },
    extends: [
        "airbnb-base",
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
    },
    rules: {
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
};
