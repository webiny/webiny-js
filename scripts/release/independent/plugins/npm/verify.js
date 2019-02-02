const execa = require("execa");
const fs = require("fs-extra");

module.exports = () => {
    return async ({ logger, config }, next) => {
        const { NPM_TOKEN } = process.env;

        if (!NPM_TOKEN) {
            throw new Error("Missing NPM_TOKEN in process.env!");
        }

        const { registryUrl = "https://registry.npmjs.org" } = config;

        logger.log("Verifying access to NPM...");
        try {
            await fs.appendFile(
                "./.npmrc",
                `\n${registryUrl.replace("http:", "").replace("https:", "")}/:_authToken=${NPM_TOKEN}`
            );
            // We need to unset the `npm_` env variables to make sure local `.npmrc` is being read.
            // This is required when running scripts with yarn: https://github.com/yarnpkg/yarn/issues/4475
            await execa.shell(
                `unset $(env | awk -F= '$1 ~ /^npm_/ {print $1}') & npm whoami --registry=${registryUrl}`
            );
            next();
        } catch (err) {
            throw new Error("INVALID NPM TOKEN: " + err.message);
        }
    };
};
