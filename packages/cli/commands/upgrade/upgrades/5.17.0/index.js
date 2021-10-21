/**
 * A new type of upgrade where we take the files from cwp-template-aws and copy them into required locations.
 * Old files are always backed up.
 */
const { prettierFormat, yarnInstall, assignPackageVersions, copyFiles } = require("../utils");
const cliPackage = require("@webiny/cli/package.json");
const cliPackageVersion = cliPackage.version;

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
            /**
             * Update prerendering services.
             *
             * Flush
             */
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/prerenderingService/flush/src/index.ts",
                destination: "api/code/prerenderingService/flush/src/index.ts"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/prerenderingService/flush/package.json",
                destination: "api/code/prerenderingService/flush/package.json"
            },
            /**
             * Queue add
             */
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/prerenderingService/queue/add/src/index.ts",
                destination: "api/code/prerenderingService/queue/add/src/index.ts"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/prerenderingService/queue/add/package.json",
                destination: "api/code/prerenderingService/queue/add/package.json"
            },
            /**
             * Queue process
             */
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/prerenderingService/queue/process/src/index.ts",
                destination: "api/code/prerenderingService/queue/process/src/index.ts"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/prerenderingService/queue/process/package.json",
                destination: "api/code/prerenderingService/queue/process/package.json"
            },
            /**
             * Render.
             */
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/prerenderingService/render/src/index.ts",
                destination: "api/code/prerenderingService/render/src/index.ts"
            },
            {
                source: "node_modules/@webiny/cwp-template-aws/template/api/code/prerenderingService/render/package.json",
                destination: "api/code/prerenderingService/render/package.json"
            }
        ];
        /**
         * Copy new files to their destinations.
         */
        copyFiles(context, targets);
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
