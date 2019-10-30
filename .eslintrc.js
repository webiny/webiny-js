module.exports = {
    parser: "babel-eslint",
    extends: ["eslint:recommended", "plugin:jest/recommended", "plugin:react/recommended"],
    plugins: ["flowtype", "jest", "import"],
    env: {
        jest: true,
        commonjs: true,
        node: true,
        es6: true
    },
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module"
    },
    rules: {
        "flowtype/define-flow-type": 1,
        "flowtype/use-flow-type": 1,
        "react/prop-types": 0,
        "import/no-unresolved": [2, { commonjs: true, amd: true }]
    },
    settings: {
        flowtype: {
            onlyFilesWithFlowAnnotation: true
        }
    }
};
