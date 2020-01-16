const alias = require("@webiny/project-utils/aliases/jest");

const babel = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    node: "8.10"
                }
            }
        ],
        "@babel/preset-typescript"
    ],
    plugins: [
        ["@babel/plugin-proposal-class-properties"],
        ["@babel/plugin-proposal-object-rest-spread", { useBuiltIns: true }],
        ["@babel/plugin-transform-runtime", { useESModules: false }],
        ["babel-plugin-dynamic-import-node"],
        ["babel-plugin-lodash"],
        process.env.NODE_ENV === "test" ? ["babel-plugin-module-resolver", { alias }] : null
    ].filter(Boolean)
};

module.exports = babel;
