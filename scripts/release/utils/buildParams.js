const Git = require("./git");
const logger = require("./logger");
const getPackage = require("./getPackage");

module.exports = async config => {
    const git = config.git || Git;

    const params = {
        logger: config.logger || logger(),
        git,
        config: {
            preview: config.preview || false,
            tagFormat: config.tagFormat || "v<%= version %>",
            registryUrl: config.registryUrl || "https://registry.npmjs.org",
            repositoryUrl: config.repositoryUrl || (await git.repoUrl())
        }
    };

    if (!config.packages) {
        params.packages = [getPackage()];
    } else {
        params.packages = Array.isArray(config.packages) ? config.packages : [config.packages];
    }

    if (!params.packages.length) {
        throw new Error(`Missing packages to process.`);
    }

    // Verify packages data structure
    params.packages.map(pkg => {
        if (
            !pkg.hasOwnProperty("name") ||
            !pkg.hasOwnProperty("package") ||
            !pkg.hasOwnProperty("location")
        ) {
            throw new Error(
                `Packages MUST contain \`name\`, \`location\` and \`package\` keys.`
            );
        }
    });

    return { params, plugins: config.plugins };
};
