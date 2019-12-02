const aliases = require("@webiny/project-utils/aliases");
const packages = require("@webiny/project-utils/packages");

module.exports = {
    name: "download-files",
    entry: "handler.js",
    plugins: ["aws-lambda"],
    webpack: config => {
        config.module.rules[0].options.babelrc = true;
        config.module.rules[0].options.babelrcRoots = packages;
        config.module.rules[0].options.presets.push("@babel/preset-flow");
        config.module.rules[0].options.plugins.push(
            "@babel/plugin-proposal-export-default-from",
            "@babel/plugin-proposal-class-properties",
            ["babel-plugin-module-resolver", { alias: aliases }]
        );
    }
};
