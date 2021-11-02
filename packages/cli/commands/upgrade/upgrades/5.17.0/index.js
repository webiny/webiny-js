const glob = require("fast-glob");

const { createMorphProject, yarnInstall, prettierFormat } = require("../utils");

const apiPrerenderingService = require("./apiPrerenderingService");
const security = require("./security");

const targetVersion = "5.17.0";

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
            ...Object.values(apiPrerenderingService.files),
            ...Object.values(security.files)
            //
        ]);

        const project = createMorphProject(files);
        /**
         * Upgrade the prerendering service files.
         */
        info("Starting with prerendering service upgrade.");
        apiPrerenderingService.upgradeFlush(project, context);
        apiPrerenderingService.upgradeRender(project, context);
        apiPrerenderingService.upgradeQueueAdd(project, context);
        apiPrerenderingService.upgradeQueueProcess(project, context);
        /**
         * Upgrade the files for new security.
         */
        info("Starting with security upgrade.");
        security.upgradeGraphQLIndex(project, context);
        security.upgradeHeadlessCMSIndex(project, context);
        security.upgradeAdminComponents(project, context);
        security.upgradeAdminPlugins(project, context);
        security.upgradeAdminSecurity(project, context);
        security.upgradeApp(project, context);
        security.upgradeAppWebinyConfig(project, context);

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
