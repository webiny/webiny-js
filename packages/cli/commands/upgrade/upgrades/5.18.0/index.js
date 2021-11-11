const glob = require("fast-glob");

const { createMorphProject, yarnInstall, prettierFormat } = require("../utils");

const apiHeadlessCms = require("./apiHeadlessCms");

const targetVersion = "5.18.0";

/**
 * @type {CliUpgradePlugin}
 */
module.exports = {
    name: `upgrade-${targetVersion}`,
    type: "cli-upgrade",
    version: targetVersion,
    /**
     * @param options {CliUpgradePluginOptions}
     * @param context {CliContext}
     * @returns {Promise<boolean>}
     */
    async canUpgrade(options, context) {
        if (context.version === targetVersion) {
            return true;
        } else if (
            context.version.match(
                new RegExp(
                    /**
                     * This is for beta testing.
                     */
                    `^${targetVersion}-`
                )
            )
        ) {
            return true;
        }
        throw new Error(
            `Upgrade must be on Webiny CLI version "${targetVersion}". Current CLI version is "${context.version}".`
        );
    },

    /**
     * @param options {CliUpgradePluginOptions}
     * @param context {CliContext}
     * @returns {Promise<void>}
     */
    async upgrade(options, context) {
        const { info } = context;

        const files = await glob([
            // add files here
            ...Object.values(apiHeadlessCms.files)
            //
        ]);

        const project = createMorphProject(files);
        /**
         * Upgrade the API Headless CMS files.
         */
        info("Starting with API Headless CMS upgrade.");
        apiHeadlessCms.upgradeGraphQL(project, context);
        apiHeadlessCms.upgradeHeadlessCMS(project, context);

        info("Writing changes...");
        await project.save();

        await prettierFormat(files, context);

        /**
         * Install new packages.
         */
        await yarnInstall({
            context
        });
    }
};
