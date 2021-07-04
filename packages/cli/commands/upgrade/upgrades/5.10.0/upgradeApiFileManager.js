const tsMorph = require("ts-morph");
const importPath = "@webiny/api-file-manager-ddb-es";
const importedVariableName = "fileManagerDynamoDbElasticPlugins";

const FM_FILES = { index: "api/code/graphql/src/index.ts" };
const CMS_FILES = { index: "api/code/headlessCMS/src/index.ts" };
const DDB2ES_FILES = { index: "api/code/dynamoToElastic/src/index.ts" };

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
    if (!lastImport) {
        throw new Error(`Missing imports in "${FM_FILES.index}".`);
    }

    source.insertImportDeclaration(lastImport.getChildIndex() + 1, {
        defaultImport: importedVariableName,
        moduleSpecifier: importPath
    });

    // Try fetching plugins from handler config object
    const plugins = source.getFirstDescendant(
        node => tsMorph.Node.isPropertyAssignment(node) && node.getName() === "plugins"
    );

    if (!plugins) {
        throw new Error(
            `Cannot upgrade the "api/code/graphql/index.ts" because it seems it's an old version of the code.`
        );
    }
    /**
     * Find the position of the file manager plugins in the createHandler.plugins array.
     */
    const fileManagerPlugins = plugins
        .getInitializer()
        .getElements()
        .findIndex(node => {
            return (
                tsMorph.Node.isCallExpression(node) &&
                node.getExpression().getText() === "fileManagerPlugins"
            );
        });
    if (!fileManagerPlugins) {
        throw new Error(
            `Could not find "fileManagerPlugins()" in the "api/code/graphql/index.ts" createHandler.plugins array.`
        );
    }
    /**
     * Add new the DynamoDB/Elasticsearch plugins to the array of plugins.
     */
    plugins.getInitializer().insertElement(fileManagerPlugins, `${importedVariableName}()`);

    /**
     * Find the "api-plugin-elastic-search-client" and replace it with the "api-elasticsearch".
     */
    const elasticsearchImportDeclaration = source.getImportDeclaration(declaration => {
        return declaration.getModuleSpecifierValue() === "@webiny/api-plugin-elastic-search-client";
    });
    if (!elasticsearchImportDeclaration) {
        return;
    }
    elasticsearchImportDeclaration.setModuleSpecifier("@webiny/api-elasticsearch");
};

const upgradeHeadlessCMSIndex = async (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(CMS_FILES.index)}`);

    const source = project.getSourceFile(CMS_FILES.index);
    /**
     * Find the "api-plugin-elastic-search-client" and replace it with the "api-elasticsearch".
     */
    const elasticsearchImportDeclaration = source.getImportDeclaration(declaration => {
        return declaration.getModuleSpecifierValue() === "@webiny/api-plugin-elastic-search-client";
    });
    if (!elasticsearchImportDeclaration) {
        return;
    }
    elasticsearchImportDeclaration.setModuleSpecifier("@webiny/api-elasticsearch");
};

const upgradeDynamoDbToElasticIndex = async (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(DDB2ES_FILES.index)}`);

    const source = project.getSourceFile(DDB2ES_FILES.index);
    /**
     * Find the "api-plugin-elastic-search-client" and replace it with the "api-elasticsearch".
     */
    const elasticsearchImportDeclaration = source.getImportDeclaration(declaration => {
        return declaration.getModuleSpecifierValue() === "@webiny/api-plugin-elastic-search-client";
    });
    if (!elasticsearchImportDeclaration) {
        return;
    }
    elasticsearchImportDeclaration.setModuleSpecifier("@webiny/api-elasticsearch");
};

upgradeGraphQLIndex.files = FM_FILES;
upgradeHeadlessCMSIndex.files = CMS_FILES;
upgradeDynamoDbToElasticIndex.files = DDB2ES_FILES;

module.exports = {
    upgradeGraphQLIndex,
    upgradeHeadlessCMSIndex,
    upgradeDynamoDbToElasticIndex
};
