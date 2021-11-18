const glob = require("fast-glob");

const { createMorphProject, yarnInstall, prettierFormat } = require("../utils");

const apiHeadlessCms = require("./apiHeadlessCms");
const webinyConfigJsUpdates = require("./webinyConfigJsUpdates");
const newCliPlugins = require("./newCliPlugins");

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
        const start = new Date();

        const { info } = context;

        const files = await glob([
            // add files here
            ...Object.values(apiHeadlessCms.files(context))
            //
        ]);

        if (files.length > 0) {
            const project = createMorphProject(files);
            /**
             * Upgrade the API Headless CMS files.
             */
            info("Starting with API Headless CMS upgrade.");

            apiHeadlessCms.upgradeGraphQL(project, context);
            apiHeadlessCms.upgradeHeadlessCMS(project, context);

            info("Writing changes...");
            await project.save();
            console.log();
        }

        // Generates new webiny.config.ts files (with new build and watch commands).
        await webinyConfigJsUpdates(context);

        // Generates new Webiny CLI (post-deploy) plugins for both Admin Area and Website React applications.
        await newCliPlugins(context);

        // Format updated files.
        await prettierFormat(files, context);

        /**
         * Install new packages.
         */
        await yarnInstall({
            context
        });

        const duration = (new Date() - start) / 1000;
        context.success(`Upgrade completed in ${context.success.hl(duration)}s.`);
    }
};
