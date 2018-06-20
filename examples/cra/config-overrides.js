const rewireReactHotLoader = require("react-app-rewire-hot-loader");
const rewireWebiny = require("./rewire/webiny");

/* config-overrides.js */
module.exports = (config, env) => {
    config = rewireReactHotLoader(config, env);
    config = rewireWebiny(config, env);

    return config;
};
