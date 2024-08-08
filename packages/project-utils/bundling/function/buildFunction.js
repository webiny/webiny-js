const { RspackBundler } = require("./bundlers/RspackBundler");
const { WebpackBundler } = require("./bundlers/WebpackBundler");

module.exports = async options => {
    const { overrides, cwd } = options;

    const { featureFlags } = require("@webiny/feature-flags");
    const bundler = featureFlags.rspack
        ? new RspackBundler({ cwd, overrides })
        : new WebpackBundler({ cwd, overrides });

    return bundler.build();
};
