const envCi = require("env-ci");

module.exports = () => {
    return async ({ packages, config, logger, git }, next, finish) => {
        const { isCi, branch, isPr } = envCi();
        
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
