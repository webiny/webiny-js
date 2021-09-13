const { addImportsToSource } = require("../utils");
const FILES = {
    graphql: "api/code/graphql/src/index.ts",
    pageBuilder: "api/code/pageBuilder/updateSettings/src/index.ts"
};

const pageBuilderDdbEsPlugins = "pageBuilderDynamoDbElasticsearchPlugins";
const pageBuilderPrerenderingPlugins = "pageBuilderPrerenderingPlugins";

const upgradeGraphQLIndex = async (project, context) => {
    const { info } = context;
    const file = FILES.graphql;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);

    addImportsToSource({
        context,
        source,
        imports: [
            {
                elementName: pageBuilderDdbEsPlugins,
                importPath: "@webiny/api-page-builder-so-ddb-es"
            },
            {
                elementName: pageBuilderPrerenderingPlugins,
                importPath: "@webiny/api-page-builder/prerendering"
            }
        ],
        file
    });
};

const upgradePageBuilderIndex = async (project, context) => {
    const { info } = context;
    const file = FILES.pageBuilder;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);

    addImportsToSource({
        context,
        source,
        imports: [
            {
                elementName: pageBuilderDdbEsPlugins,
                importPath: "@webiny/api-page-builder-so-ddb-es"
            }
        ],
        file
    });
};

module.exports = {
    upgradeGraphQLIndex,
    upgradePageBuilderIndex,
    files: FILES
};
