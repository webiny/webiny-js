const tsMorph = require("ts-morph");
const path = require("path");
const execa = require("execa");
const { createMorphProject, insertImport, addPackagesToDependencies } = require("../utils");

const targetVersion = "5.8.0";
const headlessCMS = "api/code/headlessCMS";
const graphQL = "api/code/graphql";

const traverseAndAddNewPlugin = (node, traversal) => {
    const kind = node.getKind();
    if (kind === tsMorph.SyntaxKind.ImportDeclaration) {
        traversal.skip();
    } else if (kind === tsMorph.SyntaxKind.ArrayLiteralExpression) {
        const parent = node.getParent();
        if (!parent.compilerNode || !parent.compilerNode.name) {
            traversal.skip();
            return;
        }
        const compilerNode = parent.compilerNode || {};
        const name = compilerNode.name || {};
        const escapedText = name.escapedText;
        if (escapedText !== "plugins") {
            traversal.skip();
            return;
        }
        node.addElement("headlessCmsDynamoDbElasticStorageOperation()");
        traversal.stop();
    }
};
/**
 * @type {CliUpgradePlugin}
 */
const plugin = {
    name: "upgrade-5.8.0",
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
        const { info, error, project } = context;
        /**
         * Configurations
         */
        const headlessCmsPath = path.resolve(project.root, headlessCMS);
        const graphQLPath = path.resolve(project.root, graphQL);
        const headlessCmsIndexFilePath = `${headlessCmsPath}/src/index.ts`;
        const graphQlIndexFilePath = `${graphQLPath}/src/index.ts`;
        const packages = {
            "@webiny/api-headless-cms-ddb-es": "^5.8.0"
        };
        /**
         * Headless CMS API upgrade
         */
        console.log(info.hl("Step 1 of 3: Headless CMS API upgrade"));
        /**
         * Add new package to the headless cms package.json file
         */
        console.log("Adding new package to the package.json file.");
        addPackagesToDependencies(headlessCmsPath, packages);
        /**
         * Update the index.ts file in the headless cms directory.
         */
        const headlessCmsProject = createMorphProject([headlessCmsIndexFilePath]);
        const headlessCmsIndexSourceFile =
            headlessCmsProject.getSourceFileOrThrow(headlessCmsIndexFilePath);
        console.log("Adding new plugin to index.ts file.");
        insertImport(
            headlessCmsIndexSourceFile,
            "headlessCmsDynamoDbElasticStorageOperation",
            "@webiny/api-headless-cms-ddb-es"
        );
        headlessCmsIndexSourceFile.forEachDescendant(traverseAndAddNewPlugin);
        console.log("Saving Headless CMS index.ts file.");
        await headlessCmsIndexSourceFile.save();

        /**
         * GraphQL API upgrade
         */
        console.log(info.hl("Step 2 of 3: GraphQL API upgrade"));
        /**
         * Add new package to the graphql package.json file
         */
        console.log("Adding new package to the package.json file.");
        addPackagesToDependencies(graphQLPath, packages);
        /**
         * Update the index.ts file in the headless cms directory.
         */
        const graphQlProject = createMorphProject([graphQlIndexFilePath]);
        const graphQlIndexSourceFile = graphQlProject.getSourceFileOrThrow(graphQlIndexFilePath);
        console.log("Adding new plugin to index.ts file.");
        insertImport(
            graphQlIndexSourceFile,
            "headlessCmsDynamoDbElasticStorageOperation",
            "@webiny/api-headless-cms-ddb-es"
        );

        graphQlIndexSourceFile.forEachDescendant(traverseAndAddNewPlugin);
        console.log("Saving GraphQL index.ts file.");
        await graphQlIndexSourceFile.save();

        /**
         * Run yarn to install new package
         */
        try {
            console.log(info.hl("Step 3 of 3: Installing new packages."));
            await execa("yarn");
            console.log("Installed new packages.");
        } catch (ex) {
            console.log(error.hl("Install of new packages failed."));
            console.log(error(ex.message));
            if (ex.stdout) {
                console.log(ex.stdout);
            }
        }
    }
};

module.exports = () => {
    return plugin;
};
