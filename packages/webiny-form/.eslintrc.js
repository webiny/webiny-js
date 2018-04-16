module.exports = {
    parser: "babel-eslint",
    extends: ["eslint:recommended", "plugin:react/recommended"],
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
        "no-console": "off",
        "react/prop-types": 0
    },
    settings: {
        react: {
            pragma: "React", // Pragma to use, default to "React"
            version: "16.0", // React version, default to the latest React stable release
            flowVersion: "0.63" // Flow version
        },
        flowtype: {
            onlyFilesWithFlowAnnotation: true
        }
    }
};
