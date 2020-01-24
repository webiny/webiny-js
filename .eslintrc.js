module.exports = {
    extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:jest/recommended",
        "plugin:react/recommended"
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module"
    },
    plugins: ["@typescript-eslint", "jest", "import", "react"],
    env: {
        jest: true,
        commonjs: true,
        node: true,
        es6: true
    },
    rules: {
        "react/prop-types": 0,
        "import/no-unresolved": 0, // [2, { commonjs: true, amd: true }],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/ban-ts-ignore": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/no-use-before-define": 0,
        "@typescript-eslint/no-var-requires": 0
    },
    settings: {
        react: {
            pragma: "React",
            version: "detect"
        }
    },
    globals: {
        window: true,
        document: true
    }
};
