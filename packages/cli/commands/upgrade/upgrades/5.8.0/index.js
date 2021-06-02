const tsMorph = require("ts-morph");
const path = require("path");
const { createMorphProject, insertImport, addPackageToDependencies } = require("../utils");

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
        const name = parent.compilerNode.name.escapedText;
        if (name !== "plugins") {
            traversal.skip();
            return;
        }
        node.addElement("headlessCmsDynamoDbElasticStorageOperation()");
        traversal.stop();
    }
};

module.exports = () => {
    return {
        name: "upgrade-5.8.0",
        type: "cli-upgrade",
        version: "5.8.0",
        canUpgrade() {
            return true;
        },
        async upgrade(options, context) {
            const { info, project } = context;
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
            console.log(info.hl("Step 1: Headless CMS API upgrade"));
            /**
             * Add new package to the headless cms package.json file
             */
            console.log("Adding new package to the package.json file.");
            addPackageToDependencies(headlessCmsPath, packages);
            /**
             * Update the index.ts file in the headless cms directory.
             */
            const headlessCmsProject = createMorphProject([headlessCmsIndexFilePath]);
            const headlessCmsIndexSourceFile = headlessCmsProject.getSourceFileOrThrow(
                headlessCmsIndexFilePath
            );
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
            console.log(info.hl("Step 2: GraphQL API upgrade"));
            /**
             * Add new package to the graphql package.json file
             */
            console.log("Adding new package to the package.json file.");
            addPackageToDependencies(graphQLPath, packages);
            /**
             * Update the index.ts file in the headless cms directory.
             */
            const graphQlProject = createMorphProject([graphQlIndexFilePath]);
            const graphQlIndexSourceFile = graphQlProject.getSourceFileOrThrow(
                graphQlIndexFilePath
            );
            console.log("Adding new plugin to index.ts file.");
            insertImport(
                graphQlIndexSourceFile,
                "headlessCmsDynamoDbElasticStorageOperation",
                "@webiny/api-headless-cms-ddb-es"
            );

            graphQlIndexSourceFile.forEachDescendant(traverseAndAddNewPlugin);
            console.log("Saving GraphQL index.ts file.");
            await graphQlIndexSourceFile.save();
        }
    };
};
