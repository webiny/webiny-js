const path = require("path");
const { upgradeGraphQLIndex } = require("./upgradeApiFileManager");
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
                graphql: "api/code/graphql/src/index.ts"
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

            info("Writing changes...");
            await upgrade.save();
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
