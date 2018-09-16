// NOTE: this file is required only for Webiny monorepo!! End-user will not need this file.

const path = require("path");
const getPackages = require("get-yarn-workspaces");
const packages = getPackages(path.join(process.cwd(), "../../"));

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
        "@babel/plugin-transform-destructuring",
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-object-rest-spread",
        "@babel/plugin-transform-runtime",
        "@babel/plugin-syntax-dynamic-import",
        "babel-plugin-dynamic-import-node"
    ]
};