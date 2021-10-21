/**
 * A new type of upgrade where we take the files from cwp-template-aws and copy them into required locations.
 * Old files are always backed up.
 */
const {
    prettierFormat,
    yarnInstall,
    assignPackageVersions,
    copyFolders,
    copyFiles
} = require("../utils");
const cliPackage = require("@webiny/cli/package.json");
const cliPackageVersion = cliPackage.version;

const targetVersion = "5.16.0";
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
        /**
         * We throw error here because it should not go further if version is not good.
         */
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
        const targets = [
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/graphql/src/index.ts",
                destination: "api/code/graphql/src/index.ts"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/graphql/package.json",
                destination: "api/code/graphql/package.json"
            },
            // Update cloud resources for "dev" environment
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/pulumi/dev/index.ts",
                destination: "api/pulumi/dev/index.ts"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/pulumi/dev/policies.ts",
                destination: "api/pulumi/dev/policies.ts"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/pulumi/dev/pageBuilder.ts",
                destination: "api/pulumi/dev/pageBuilder.ts"
            },
            // Update cloud resources for "prod" environment
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/pulumi/prod/index.ts",
                destination: "api/pulumi/prod/index.ts"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/pulumi/prod/policies.ts",
                destination: "api/pulumi/prod/policies.ts"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/pulumi/prod/pageBuilder.ts",
                destination: "api/pulumi/prod/pageBuilder.ts"
            }
        ];
        /**
         * Copy new files to their destinations.
         */
        copyFiles(context, targets);
        /**
         * Copy folders to their destinations.
         */
        copyFolders(context, [
            /**
             * Export/import pages.
             */
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/pageBuilder/exportPages",
                destination: "api/code/pageBuilder/exportPages"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/pageBuilder/importPages",
                destination: "api/code/pageBuilder/importPages"
            }
        ]);
        /**
         * If any package.json destinations, set the versions to current one.
         */
        assignPackageVersions(context, targets, cliPackageVersion);

        await prettierFormat(
            targets.map(t => t.destination),
            context
        );

        /**
         * Install new packages.
         */
        await yarnInstall({
            context
        });

        context.info("\n");
        context.info("Existing files were backed up and new ones created.");
        context.info(
            "You must transfer the custom parts of the code from the backed up files if you want everything to work properly."
        );
    }
};
