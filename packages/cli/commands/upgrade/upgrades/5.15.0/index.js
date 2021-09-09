const path = require("path");
const apiPageBuilderUpgrade = require("./upgradeApiPageBuilder");

const targetVersion = "5.15.0";

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
        const glob = require("fast-glob");

        const {
            createMorphProject,
            addPackagesToDependencies,
            yarnInstall,
            prettierFormat
        } = require("../utils");

        const files = await glob([
            // add files here
            ...Object.values(apiPageBuilderUpgrade.files)
            //
        ]);

        const project = createMorphProject(files);
        /**
         * Upgrade the graphql with new page builder packages.
         */
        await apiPageBuilderUpgrade.upgradeGraphQLIndex(project, context);

        info("Adding dependencies...");

        addPackagesToDependencies(context, path.resolve(process.cwd(), "api/code/graphql"), {
            "@webiny/api-page-builder-so-ddb-es": context.version
        });

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
