// eslint-disable-next-line
const tsMorph = require("ts-morph");

const {
    insertImportToSourceFile,
    removeImportFromSourceFile,
    removePluginFromCreateHandler,
    addPluginToCreateHandler,
    addElasticsearchClient
} = require("../utils");

const paths = {
    graphQL: "api/code/graphql",
    headlessCMS: "api/code/headlessCMS"
};

const files = {
    graphQLIndex: `${paths.graphQL}/src/index.ts`,
    headlessCMSIndex: `${paths.headlessCMS}/src/index.ts`
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeGraphQL = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(paths.graphQL)}`);

    const source = project.getSourceFile(files.graphQLIndex);

    removeImportFromSourceFile(source, "@webiny/api-headless-cms/plugins");
    removeImportFromSourceFile(source, "@webiny/api-headless-cms-ddb-es");

    insertImportToSourceFile({
        source,
        name: ["createAdminHeadlessCms"],
        moduleSpecifier: "@webiny/api-headless-cms/plugins",
        after: "@webiny/api-form-builder-so-ddb-es"
    });
    insertImportToSourceFile({
        source,
        name: {
            createStorageOperations: "createHeadlessCmsStorageOperations"
        },
        moduleSpecifier: "@webiny/api-headless-cms-ddb-es",
        after: "@webiny/api-headless-cms/plugins"
    });

    insertImportToSourceFile({
        source,
        name: "headlessCmsModelFieldToGraphQLPlugins",
        moduleSpecifier: "@webiny/api-headless-cms/content/plugins/graphqlFields",
        after: "@webiny/api-headless-cms-ddb-es"
    });

    removePluginFromCreateHandler(source, "handler", "headlessCmsPlugins()");
    removePluginFromCreateHandler(
        source,
        "handler",
        "headlessCmsDynamoDbElasticStorageOperation()"
    );

    addPluginToCreateHandler({
        source,
        handler: "handler",
        value: `createAdminHeadlessCms({
            setupGraphQL: true,
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient,
                modelFieldToGraphQLPlugins: headlessCmsModelFieldToGraphQLPlugins(),
                plugins: [elasticsearchDataGzipCompression()]
            })
        })`,
        after: new RegExp("createFormBuilder")
    });
};
/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeHeadlessCMS = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(paths.headlessCMS)}`);

    const source = project.getSourceFile(files.headlessCMSIndex);

    removeImportFromSourceFile(source, "@webiny/api-headless-cms/content");
    removeImportFromSourceFile(source, "@webiny/api-headless-cms-ddb-es");

    addElasticsearchClient(source);

    insertImportToSourceFile({
        source,
        name: "dynamoDbPlugins",
        moduleSpecifier: "@webiny/db-dynamodb/plugins",
        after: "@webiny/db-dynamodb"
    });

    insertImportToSourceFile({
        source,
        name: ["createContentHeadlessCms"],
        moduleSpecifier: "@webiny/api-headless-cms/content",
        after: "@webiny/handler-logs"
    });
    insertImportToSourceFile({
        source,
        name: {
            createStorageOperations: "createHeadlessCmsStorageOperations"
        },
        moduleSpecifier: "@webiny/api-headless-cms-ddb-es",
        after: "@webiny/api-headless-cms/content"
    });
    insertImportToSourceFile({
        source,
        name: "headlessCmsModelFieldToGraphQLPlugins",
        moduleSpecifier: "@webiny/api-headless-cms/content/plugins/graphqlFields",
        after: "@webiny/api-headless-cms-ddb-es"
    });

    removeImportFromSourceFile(source, "@webiny/api-elasticsearch");

    removePluginFromCreateHandler(source, "handler", "headlessCmsPlugins");
    removePluginFromCreateHandler(
        source,
        "handler",
        "headlessCmsDynamoDbElasticStorageOperation()"
    );

    removePluginFromCreateHandler(source, "handler", "elasticsearchClientContextPlugin");
    removePluginFromCreateHandler(source, "handler", "elasticsearchDataGzipCompression");

    addPluginToCreateHandler({
        source,
        handler: "handler",
        value: `createContentHeadlessCms({
            setupGraphQL: true,
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient,
                modelFieldToGraphQLPlugins: headlessCmsModelFieldToGraphQLPlugins(),
                plugins: [elasticsearchDataGzipCompression()]
            })
        })`,
        after: new RegExp("createFormBuilder")
    });
    addPluginToCreateHandler({
        source,
        handler: "handler",
        value: "dynamoDbPlugins()",
        after: "logsPlugins"
    });
};

module.exports = {
    files,
    upgradeGraphQL,
    upgradeHeadlessCMS
};
