// @flowIgnore
const aliases = require("../aliases");

module.exports = function(api, opts, env) {
    api.cache(true);
    const isDevelopment = env === "development";

    return {
        presets: ["babel-preset-react-app"],
        plugins: [
            ["babel-plugin-module-resolver", { alias: aliases }],
            isDevelopment && ["react-hot-loader/babel"],
            ["babel-plugin-emotion", { autoLabel: true }],
            ["babel-plugin-lodash", { id: ["lodash", "recompose"] }]
        ].filter(Boolean)
    };
};
