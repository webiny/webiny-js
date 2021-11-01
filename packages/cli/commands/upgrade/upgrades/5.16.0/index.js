/**
 * A new type of upgrade where we take the files from cwp-template-aws and copy them into required locations.
 * Old files are always backed up.
 */
const {
    prettierFormat,
    yarnUp,
    addWorkspaceToRootPackageJson,
    removeWorkspaceToRootPackageJson
} = require("../utils");
const { copyFolders, copyFiles } = require("../fileUtils");
const path = require("path");
const fs = require("fs");
const cliPackageJson = require("@webiny/cli/package.json");

const targetVersion = cliPackageJson.version;

/**
 *
 * @param context {CliContext}
 * @param initialTargets {{source: string, destination: string}[]}
 */
const assignPackageVersions = (context, initialTargets) => {
    const targets = initialTargets
        .filter(target => target.destination.match(/package\.json$/) !== null)
        .map(target => target.destination);
    if (targets.length === 0) {
        return;
    }
    context.info("Assigning proper package versions...");
    for (const target of targets) {
        const file = path.join(process.cwd(), target);
        try {
            const json = JSON.parse(fs.readFileSync(file).toString());
            /**
             *
             * @type {{}}
             */
            json.dependencies = Object.keys(json.dependencies).reduce((dependencies, key) => {
                if (key.match(/^@webiny\//) === null) {
                    dependencies[key] = json.dependencies[key];
                    return dependencies;
                } else if (json.dependencies[key] === "latest") {
                    dependencies[key] = `${targetVersion}`;
                } else {
                    dependencies[key] = json.dependencies[key];
                }

                return dependencies;
            }, {});
            /**
             *
             */
            if (json.devDependencies) {
                json.devDependencies = Object.keys(json.devDependencies).reduce(
                    (dependencies, key) => {
                        if (key.match(/^@webiny\//) === null) {
                            dependencies[key] = json.devDependencies[key];
                            return dependencies;
                        } else if (json.devDependencies[key] === "latest") {
                            dependencies[key] = `${targetVersion}`;
                        } else {
                            dependencies[key] = json.devDependencies[key];
                        }

                        return dependencies;
                    },
                    {}
                );
            }
            fs.writeFileSync(file, JSON.stringify(json));
        } catch (ex) {
            console.error(ex.message);
        }
    }
};

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
        assignPackageVersions(context, targets);

        /**
         * Update workspaces in root package.json.
         */
        context.info("Update workspaces in root package.json...");
        const rootPackageJson = path.join(context.project.root, "package.json");
        await addWorkspaceToRootPackageJson(rootPackageJson, [
            "api/code/pageBuilder/updateSettings",
            "api/code/pageBuilder/importPages/*",
            "api/code/pageBuilder/exportPages/*"
        ]);
        await removeWorkspaceToRootPackageJson(rootPackageJson, ["api/code/pageBuilder/*"]);

        await prettierFormat(
            targets.map(t => t.destination),
            context
        );

        /**
         * Up the versions again and install the packages.
         */
        await yarnUp({
            context,
            targetVersion
        });

        context.info("\n");
        context.info("Existing files were backed up and new ones created.");
        context.info(
            "You must transfer the custom parts of the code from the backed up files if you want everything to work properly."
        );
    }
};
