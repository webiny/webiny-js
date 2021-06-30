const path = require("path");
const { upgradeGraphQLIndex } = require("./upgradeApiFileManager");
const { upgradeDeliveryPath } = require("./upgradeDeliveryPath");
const { upgradeApolloCachePlugins } = require("./upgradeApolloCachePlugins");

const {
    createMorphProject,
    addPackagesToDependencies,
    yarnInstall,
    prettierRun
} = require("../utils");

const targetVersion = "5.10.0";
const plugin = () => {
    return {
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

            const files = {
                graphql: "api/code/graphql/src/index.ts",
                ...upgradeApolloCachePlugins.files
            };

            const filePaths = Object.values(files).map(file => path.resolve(process.cwd(), file));

            const upgrade = createMorphProject(filePaths);

            /**
             * Upgrade the graphql with new packages.
             */
            await upgradeGraphQLIndex({
                source: upgrade.getSourceFile(files.graphql),
                file: files.graphql,
                context
            });

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
            await upgradeApolloCachePlugins(upgrade, context);

            info("Writing changes...");
            await upgrade.save();

            // Changes "/static-*" to "/static/*", in delivery.ts Pulumi file.
            // Not using TS Morph, but a simple replace-in-path approach.
            upgradeDeliveryPath({ context });

            /**
             * Run prettier on all changed files.
             */
            await prettierRun({
                context,
                files: filePaths
            });
            /**
             * Install new packages.
             */
            await yarnInstall({
                context
            });
        }
    };
};

module.exports = plugin;
