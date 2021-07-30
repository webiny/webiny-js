const tsMorph = require("ts-morph");
const { addImportsToSource } = require("../utils");
const FILES = {
    dynamodbToElastic: "api/code/dynamoToElastic/src/index.ts",
    graphql: "api/code/graphql/src/index.ts",
    headlessCMS: "api/code/headlessCMS/src/index.ts"
};

const elementName = "elasticsearchDataGzipCompression";
const importPath = "@webiny/api-elasticsearch/plugins/GzipCompression";

const upgradeDynamoDbToElasticIndex = (project, context) => {
    const { info } = context;
    const file = FILES.dynamodbToElastic;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);
    /**
     * First we need to check if there are plugins in the createHandler because user might have added it.
     */
    const plugins = source.getFirstDescendant(
        node =>
            tsMorph.Node.isPropertyAssignment(node) &&
            tsMorph.Node.isArrayLiteralExpression(node) &&
            node.getName() === "plugins"
    );
    /**
     * We need to upgrade the old createHandler if plugins do not exist.
     */
    if (!plugins) {
        const createHandler = source.getFirstDescendant(
            node =>
                tsMorph.Node.isCallExpression(node) &&
                node.getExpression().getText() === "createHandler"
        );

        const createHandlerPlugins = createHandler.getArguments();
        const pluginsList = createHandlerPlugins.map(plugin => plugin.getFullText());
        /**
         * Remove existing arguments.
         */
        for (const plugin of createHandlerPlugins) {
            createHandler.removeArgument(plugin);
        }
        /**
         * Add new way of creating the handler.
         */
        createHandler.addArgument(`{plugins: [${pluginsList.join(",")}]}`);
    }
    /**
     * Then add whats required to the plugins.
     */
    addImportsToSource({
        context,
        source,
        imports: [
            {
                elementName,
                importPath
            }
        ],
        file
    });
};

const upgradeGraphQLIndex = (project, context) => {
    const { info } = context;
    const file = FILES.graphql;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);

    addImportsToSource({
        context,
        source,
        imports: [
            {
                elementName,
                importPath
            }
        ],
        file
    });
};

const upgradeHeadlessCMSIndex = (project, context) => {
    const { info } = context;
    const file = FILES.headlessCMS;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);

    addImportsToSource({
        context,
        source,
        imports: [
            {
                elementName,
                importPath
            }
        ],
        file
    });
};

module.exports = {
    upgradeDynamoDbToElasticIndex,
    upgradeGraphQLIndex,
    upgradeHeadlessCMSIndex,
    files: FILES
};
