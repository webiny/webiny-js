const path = require("path");
const securityUpgrade = require("./upgradeApiSecurity");
const elasticsearchUpgrade = require("./upgradeElasticsearch");

const targetVersion = "5.12.0";

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
            [...Object.values(securityUpgrade.files), ...Object.values(elasticsearchUpgrade.files)],
            {
                cwd: context.project.root,
                onlyFiles: true,
                ignore: ["**/node_modules/**"]
            }
        );

        const project = createMorphProject(files);
        /**
         * Upgrade the graphql with new security packages.
         */
        await securityUpgrade.upgradeGraphQLIndex(project, context);
        /**
         * Upgrade the api headless cms with new security packages.
         */
        await securityUpgrade.upgradeHeadlessCMSIndex(project, context);
        /**
         * Upgrade the dynamodb to elasticsearch with new compression package.
         */
        await elasticsearchUpgrade.upgradeDynamoDbToElasticIndex(project, context);
        /**
         * Upgrade the graphql with new compression package.
         */
        await elasticsearchUpgrade.upgradeGraphQLIndex(project, context);
        /**
         * Upgrade the api headless cms to elasticsearch with new compression package.
         */
        await elasticsearchUpgrade.upgradeHeadlessCMSIndex(project, context);
        info("Adding dependencies...");

        addPackagesToDependencies(path.resolve(process.cwd(), "api/code/graphql"), {
            "@webiny/api-security-admin-users-so-ddb": context.version
        });
        addPackagesToDependencies(path.resolve(process.cwd(), "api/code/headlessCMS"), {
            "@webiny/api-security-admin-users-so-ddb": context.version
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
