module.exports = {
    parser: "babel-eslint",
    extends: "eslint:recommended",
    plugins: ["flowtype"],
    env: {
        browser: true,
        commonjs: true,
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
