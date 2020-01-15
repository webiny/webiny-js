const cloneDeep = require("lodash.clonedeep");
const set = require("lodash.set");
const WebpackBar = require("webpackbar");
const aliases = require("../aliases/webpack");

const removeModuleScopePlugin = config => {
    config.resolve.plugins = config.resolve.plugins.filter(
        p => p.constructor.name !== "ModuleScopePlugin"
    );
    return config;
};

const webinyConfig = {
    webpack(config) {
        const newConfig = {
            ...config,
            plugins: [...config.plugins, new WebpackBar({ name: "Webiny" })],
            module: { ...config.module, rules: cloneDeep(config.module.rules) }
        };

        // Enable .babelrc in the app
        require("./babel")(newConfig.module.rules);

        // Add proper includePaths
        require("./sass")(newConfig);

        set(newConfig, "resolve.alias.react-dom", "@hot-loader/react-dom");

        Object.keys(aliases).forEach(key => {
            set(newConfig, `resolve.alias.${key}`, aliases[key]);
        });

        return removeModuleScopePlugin(newConfig);
    },
    jest: config => {
        config["moduleNameMapper"] = config["moduleNameMapper"] || {};
        config["moduleNameMapper"]["^@svgr/webpack!.*$"] = __dirname + "/svgImportMock";

        return config;
    },
    devServer: config => {
        set(config, "proxy./files", {
            target: process.env.REACT_APP_FILES_PROXY,
            changeOrigin: true
        });

        return config;
    }
};

module.exports = (customizer = null) => {
    if (typeof customizer === "function") {
        return customizer(webinyConfig);
    }

    return webinyConfig;
};
