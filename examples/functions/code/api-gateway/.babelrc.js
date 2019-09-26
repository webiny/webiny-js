const aliases = require("@webiny/project-utils/aliases");

module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    node: "8.10"
                }
            }
        ],
        "@babel/preset-flow"
    ],
    plugins: [
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-object-rest-spread",
        "@babel/plugin-transform-runtime",
        ["babel-plugin-module-resolver", { alias: aliases }]
    ]
};
