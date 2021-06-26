const path = require("path");
const { createMorphProject, prettierFormat } = require("../utils");

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

        const files = await glob(["api/pulumi/**/*.ts"], {
            cwd: context.project.root,
            onlyFiles: true,
            ignore: ["**/node_modules/**"]
        });

        const project = createMorphProject(files);
        const { upgradeLambdaConfig } = require("./upgradeLambdaConfig");
        await upgradeLambdaConfig(project, context);

        info("Writing changes...");
        await project.save();

        await prettierFormat(files, context);
    }
};
