function getNoUnusedVars() {
    if ("ESLINT_NO_UNUSED_VARS" in process.env) {
        return parseInt(process.env["ESLINT_NO_UNUSED_VARS"]);
    }

    return 1;
}

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
    plugins: ["@typescript-eslint", "jest", "import", "react", "lodash"],
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
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/ban-ts-comment": [
            2,
            {
                "ts-check": true,
                "ts-ignore": "allow-with-description",
                "ts-nocheck": "allow-with-description",
                "ts-expect-error": false
            }
        ],
        "@typescript-eslint/ban-types": "error",
        "@typescript-eslint/no-use-before-define": 0,
        "@typescript-eslint/no-unused-vars": getNoUnusedVars(),
        "@typescript-eslint/no-var-requires": 0,
        "@typescript-eslint/no-explicit-any": 0,
        // Temporarily disable this rule
        "@typescript-eslint/no-non-null-assertion": 0,
        curly: ["error"],
        "jest/expect-expect": 0,
        // Sometimes we have to use expect() inside try/catch clause (for async calls).
        // This rule raises an error when you do that, so we disabled it.
        "jest/no-conditional-expect": 0,
        "jest/no-commented-out-tests": 0,
        "jest/no-disabled-tests": 0,
        "lodash/import-scope": [2, "method"],
        "no-restricted-imports": [
            "error",
            {
                patterns: [
                    {
                        group: ["@aws-sdk/*"],
                        message: "Please use @webiny/aws-sdk instead."
                    }
                ]
            }
        ],
        "import/dynamic-import-chunkname": [
            2,
            {
                importFunctions: ["dynamicImport"],
                allowEmpty: false
            }
        ]
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
