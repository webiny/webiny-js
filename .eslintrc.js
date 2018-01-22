module.exports = {
    parser: "babel-eslint",
    extends: "eslint:recommended",
    plugins: ["flowtype"],
    env: {
        mocha: true,
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
        "no-console": "off"
    },
    settings: {
        flowtype: {
            onlyFilesWithFlowAnnotation: true
        }
    }
};
