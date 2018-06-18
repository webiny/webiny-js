const path = require("path");
const rewireReactHotLoader = require("react-app-rewire-hot-loader");
const rewireSass = require("./utils/rewire-sass");

/* config-overrides.js */
module.exports = function override(config, env) {
    config = rewireReactHotLoader(config, env);
    config = rewireSass(config, env);

    config.module.rules[0].use.push(path.resolve("./utils/hot-accept-loader"));

    return config;
};
