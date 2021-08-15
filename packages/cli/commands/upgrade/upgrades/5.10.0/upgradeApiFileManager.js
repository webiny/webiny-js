const { Node } = require("ts-morph");
const importPath = "@webiny/api-file-manager-ddb-es";
const importedVariableName = "fileManagerDynamoDbElasticPlugins";

const FM_FILES = { index: "api/code/graphql/src/index.ts" };
const CMS_FILES = { index: "api/code/headlessCMS/src/index.ts" };
const DDB2ES_FILES = { index: "api/code/dynamoToElastic/src/index.ts" };

const pluginElasticsearchClientImportPath = "@webiny/api-plugin-elastic-search-client";

const isFileManagerPlugins = node => {
    return Node.isCallExpression(node) && node.getExpression().getText() === "fileManagerPlugins";
};

const upgradeGraphQLIndex = async (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(FM_FILES.index)}`);

    const source = project.getSourceFile(FM_FILES.index);

    const fileManagerDynamoDbElasticPluginsImport = source.getImportDeclaration(importPath);
    if (fileManagerDynamoDbElasticPluginsImport) {
        info(`Import ${info.hl(importPath)} already exists in ${info.hl(FM_FILES.index)}.`);
        return;
    }
    const lastImport = source.getImportDeclarations().pop();
    if (lastImport) {
        source.insertImportDeclaration(lastImport.getChildIndex() + 1, {
            defaultImport: importedVariableName,
            moduleSpecifier: importPath
        });
    }

    // Try fetching plugins from handler config object
    const plugins = source.getFirstDescendant(
        node => Node.isPropertyAssignment(node) && node.getName() === "plugins"
    );

    /**
     * Add new the DynamoDB/Elasticsearch plugins to the array of plugins.
     */
    if (plugins) {
        // New "createHandler" syntax
        const fileManagerPlugins = plugins
            .getInitializer()
            .getElements()
            .findIndex(isFileManagerPlugins);

        if (fileManagerPlugins > -1) {
            plugins
                .getInitializer()
                .insertElement(fileManagerPlugins + 1, `${importedVariableName}()`);
        }
    } else {
        // Old "createHandler" syntax
        const plugins = file.getFirstDescendant(
            node =>
                Node.isCallExpression(node) && node.getExpression().getText() === "createHandler"
        );

        const fileManagerPlugins = plugins.getArguments().findIndex(isFileManagerPlugins);
        if (fileManagerPlugins > -1) {
            plugins.insertArgument(fileManagerPlugins + 1, `${importedVariableName}()`);
        }
    }

    /**
     * Find the position of the file manager plugins in the createHandler.plugins array.
     */

    replaceElasticsearchImportDeclarationPath(source);
};

const upgradeHeadlessCMSIndex = async (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(CMS_FILES.index)}`);

    const source = project.getSourceFile(CMS_FILES.index);
    replaceElasticsearchImportDeclarationPath(source);
};

const upgradeDynamoDbToElasticIndex = async (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(DDB2ES_FILES.index)}`);

    const source = project.getSourceFile(DDB2ES_FILES.index);
    replaceElasticsearchImportDeclarationPath(source);
};

const replaceElasticsearchImportDeclarationPath = source => {
    /**
     * Find the old package and replace it with the "api-elasticsearch".
     */
    const elasticsearchImportDeclaration = source.getImportDeclaration(
        pluginElasticsearchClientImportPath
    );

    if (elasticsearchImportDeclaration) {
        elasticsearchImportDeclaration.setModuleSpecifier("@webiny/api-elasticsearch");
    }
};

upgradeGraphQLIndex.files = FM_FILES;
upgradeHeadlessCMSIndex.files = CMS_FILES;
upgradeDynamoDbToElasticIndex.files = DDB2ES_FILES;

module.exports = {
    upgradeGraphQLIndex,
    upgradeHeadlessCMSIndex,
    upgradeDynamoDbToElasticIndex
};
