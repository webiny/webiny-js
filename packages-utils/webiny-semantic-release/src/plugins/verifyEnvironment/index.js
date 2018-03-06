import envCi from "env-ci";
import _ from "lodash";

export default () => {
    return async ({ packages, config, logger, git }, next, finish) => {
        const { isCi, branch, isPr } = envCi();

        if (!Array.isArray(packages)) {
            throw new Error(`ENOPACKAGES: missing packages to process.`);
        }

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
                "This run was triggered on %s branch, while `webiny-semantic-release` is configured to only publish from %s.",
                branch,
                config.branch
            );
            logger.log("Exiting without publishing.");
            return finish();
        }

        const tagFormat = config.tagFormat(packages[0]);

        // Verify that compiling the `tagFormat` produce a valid Git tag
        const tagName = _.template(tagFormat)({ version: "0.0.0" });
        if (!await git.verifyTagName(tagName)) {
            throw new Error(
                `EINVALIDTAGFORMAT: You have specified an invalid tag format \`${tagFormat}\``
            );
        }

        // Verify the `tagFormat` contains the variable `version` by compiling the `tagFormat` template
        // with a space as the `version` value and verify the result contains the space.
        // The space is used as it's an invalid tag character, so it's guaranteed to not be present in the `tagFormat`.
        if ((_.template(tagFormat)({ version: " " }).match(/ /g) || []).length !== 1) {
            throw new Error(
                `ETAGNOVERSION: \`version\` variable must be present in the tag format.`
            );
        }

        logger.log("Run automated release from branch %s", config.branch);

        next();
    };
};
