module.exports = (config, env, defaultConfig) => {
    defaultConfig.module.rules[1].use = [{ loader: "raw-loader" }];
    return defaultConfig;
};
