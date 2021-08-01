const path = require("path");
const i18nUpgrade = require("./upgradeApiI18n");
const objectFieldUpgrade = require("./upgradeObjectField");
const websiteUpgrade = require("./upgradeWebsite");

const targetVersion = "5.11.0";

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

        const files = await glob(
            [
                ...Object.values(i18nUpgrade.files),
                ...Object.values(objectFieldUpgrade.files),
                ...Object.values(websiteUpgrade.files)
            ],
            {
                cwd: context.project.root,
                onlyFiles: true,
                ignore: ["**/node_modules/**"]
            }
        );

        const project = createMorphProject(files);
        /**
         * Upgrade the graphql with new packages.
         */
        await i18nUpgrade.upgradeGraphQLIndex(project, context);
        /**
         * Upgrade the api headless cms with new packages.
         */
        await i18nUpgrade.upgradeHeadlessCMSIndex(project, context);
        /**
         * Upgrade the app headless cms with new packages.
         */
        await objectFieldUpgrade.upgradeAppHeadlessCMS(project, context);

        info("Adding dependencies...");

        addPackagesToDependencies(path.resolve(process.cwd(), "api/code/graphql"), {
            "@webiny/api-i18n-ddb": context.version
        });
        addPackagesToDependencies(path.resolve(process.cwd(), "api/code/headlessCMS"), {
            "@webiny/api-i18n-ddb": context.version
        });

        /**
         * Fix form builder validator imports in website app.
         */
        websiteUpgrade.upgradeFormBuilderImports(project, context);

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
