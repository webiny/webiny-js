const tsMorph = require("ts-morph");
const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");

const addPackageToJson = targetPath => {
    const file = `${targetPath}/package.json`;
    const json = loadJson.sync(file);
    if (!json) {
        throw new Error(`There is no package.json file "${file}"`);
    } else if (!json.dependencies) {
        throw new Error(`There is no dependencies property in package.json "${file}"`);
    }
    json.dependencies["@webiny/api-headless-cms-ddb-es"] = "^5.8.0";

    writeJson.sync(file, json);
};

const insertImport = (source, name, pkg) => {
    const statements = source.getStatements();
    /**
     * In the code first we need to find the last import statement and insert new import after that
     */
    const lastImportStatement = statements.reduce((indexAt, statement, index) => {
        if (statement.getKind() !== tsMorph.SyntaxKind.ImportDeclaration) {
            return indexAt;
        }
        return index > indexAt ? index : indexAt;
    }, -1);
    if (lastImportStatement === -1) {
        throw new Error(
            `Could not find last import statement so we can insert new import "${name}"`
        );
    }

    console.log(`Inserting import to position ${lastImportStatement + 1}`);
    source.insertStatements(lastImportStatement + 1, `import ${name} from "${pkg}";`);
};

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
             * Configurations or reusable variables
             */
            const headlessCmsPath = path.resolve(project.root, headlessCMS);
            const graphQLPath = path.resolve(project.root, graphQL);
            const headlessCmsIndexFilePath = `${headlessCmsPath}/src/index.ts`;
            const graphQlIndexFilePath = `${graphQLPath}/src/index.ts`;
            /**
             * Headless CMS API upgrade
             */
            console.log(info.hl("Step 1: Headless CMS API upgrade"));
            /**
             * Add new package to the headless cms package.json file
             */
            console.log("Adding new package to the package.json file.");
            addPackageToJson(headlessCmsPath);
            /**
             * Update the index.ts file in the headless cms directory.
             */
            const headlessCmsProject = new tsMorph.Project();
            headlessCmsProject.addSourceFileAtPath(headlessCmsIndexFilePath);
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
            addPackageToJson(graphQLPath);
            /**
             * Update the index.ts file in the headless cms directory.
             */
            const graphQlProject = new tsMorph.Project();
            graphQlProject.addSourceFileAtPath(graphQlIndexFilePath);
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
