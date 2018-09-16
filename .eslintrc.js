module.exports = {
    parser: "babel-eslint",
    extends: ["eslint:recommended", "plugin:jest/recommended"],
    plugins: ["flowtype", "jest", "webiny"],
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
        "webiny/flow-required": 2
    },
    settings: {
        flowtype: {
            onlyFilesWithFlowAnnotation: true
        }
    }
};
