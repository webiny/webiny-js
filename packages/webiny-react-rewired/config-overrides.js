// @flowIgnore
module.exports = (rewired = {}) => {
    const packages = rewired.packages || require("./packages")();
    const aliases = rewired.aliases || require("./aliases")(packages);
    
    return {
        webpack(config) {
            // Enable .babelrc in each monorepo package
            const overrideBabel = rewired.overrideBabel || require("./overrides/babel");
            overrideBabel({ packages, aliases })(config.module.rules);

            // Add proper includePaths
            const overrideSass = rewired.overrideSass || require("./overrides/sass");
            overrideSass(config);

            return config;
        }
    };
};
