const path = require("path");
const targetVersion = "5.10.0";

/**
 * @type {CliUpgradePlugin}
 */
module.exports = {
    name: "upgrade-5.10.0",
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
        const { upgradeLambdaConfig } = require("./upgradeLambdaConfig");
        const {
            upgradeGraphQLIndex,
            upgradeHeadlessCMSIndex,
            upgradeDynamoDbToElasticIndex
        } = require("./upgradeApiFileManager");
        const { upgradeDeliveryPath } = require("./upgradeDeliveryPath");
        const { upgradeApolloCachePlugins } = require("./upgradeApolloCachePlugins");

        const {
            createMorphProject,
            addPackagesToDependencies,
            yarnInstall,
            prettierFormat
        } = require("../utils");

        const files = await glob(
            [
                "api/pulumi/**/*.ts",
                ...Object.values(upgradeGraphQLIndex.files),
                ...Object.values(upgradeHeadlessCMSIndex.files),
                ...Object.values(upgradeDynamoDbToElasticIndex.files),
                ...Object.values(upgradeApolloCachePlugins.files)
            ],
            {
                cwd: context.project.root,
                onlyFiles: true,
                ignore: ["**/node_modules/**"]
            }
        );

        const project = createMorphProject(files);
        await upgradeLambdaConfig(project, context);

        /**
         * Upgrade the graphql with new packages.
         */
        await upgradeGraphQLIndex(project, context);
        /**
         * Upgrade the headless cms with new packages.
         */
        await upgradeHeadlessCMSIndex(project, context);
        /**
         * Upgrade the dynamodbToElastic with new packages.
         */
        await upgradeDynamoDbToElasticIndex(project, context);

        info("Adding dependencies...");

        addPackagesToDependencies(path.resolve(process.cwd(), "api/code/graphql"), {
            "@webiny/api-file-manager-ddb-es": targetVersion
        });

        /**
         * Adds the Apollo Cache plugin to the Website's React application.
         * Also, makes sure that both...
         * packages/cwp-template-aws/template/apps/website/code/src/components/apolloClient.ts
         * packages/cwp-template-aws/template/apps/admin/code/src/components/apolloClient.ts
         *
         * ... are using `plugins.byType<ApolloCacheObjectIdPlugin>` when setting `dataIdFromObject`
         */
        await upgradeApolloCachePlugins(project, context);

        // Changes "/static-*" to "/static/*", in delivery.ts Pulumi file.
        // Not using TS Morph, but a simple replace-in-path approach.
        upgradeDeliveryPath({ context });

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
