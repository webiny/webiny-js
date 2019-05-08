const envCi = require("env-ci");
const execa = require("execa");

module.exports = () => {
    return async ({ config, logger }, next, finish) => {
        const { isCi, isPr } = envCi();

        const { stdout: branch } = await execa("git", ["rev-parse", "--abbrev-ref", "HEAD"]);

        if (!isCi && !config.preview && config.ci) {
            logger.log(
                "This run was not triggered in a known CI environment, running in dry-run mode."
            );
            config.preview = true;
        }

        if (isCi && isPr && config.ci) {
            logger.log(
                "This run was triggered by a pull request and therefore a new version won't be published."
            );
            return finish();
        }

        if (branch !== config.branch) {
            logger.log(
                "This run was triggered on %s branch, while configured to only publish from %s.",
                branch,
                config.branch
            );
            logger.log("Exiting without publishing.");
            return finish();
        }

        logger.log("Run release from branch %s", config.branch);

        next();
    };
};
