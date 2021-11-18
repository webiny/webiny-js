// eslint-disable-next-line
const tsMorph = require("ts-morph");
const fs = require("fs");
const path = require("path");

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

const files = context => {
    const files = {};

    {
        const checkPath = path.join(context.project.root, "api", "code", "graphql");
        if (fs.existsSync(checkPath)) {
            files.graphQLIndex = `${paths.graphQL}/src/index.ts`;
        }
    }

    {
        const checkPath = path.join(context.project.root, "api", "code", "headlessCMS");
        if (fs.existsSync(checkPath)) {
            files.headlessCMSIndex = `${paths.headlessCMS}/src/index.ts`;
        }
    }

    return files;
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeGraphQL = (project, context) => {
    const checkPath = path.join(context.project.root, "api", "code", "graphql");
    if (!fs.existsSync(checkPath)) {
        return;
    }

    const { info } = context;
    info(`Upgrading ${info.hl(paths.graphQL)}`);

    const source = project.getSourceFile(files(context).graphQLIndex);

    removeImportFromSourceFile(source, "@webiny/api-headless-cms/plugins");
    removeImportFromSourceFile(source, "@webiny/api-headless-cms-ddb-es");

    insertImportToSourceFile({
        source,
        name: ["createAdminHeadlessCmsContext", "createAdminHeadlessCmsGraphQL"],
        moduleSpecifier: "@webiny/api-headless-cms",
        after: "@webiny/api-form-builder-so-ddb-es"
    });
    insertImportToSourceFile({
        source,
        name: {
            createStorageOperations: "createHeadlessCmsStorageOperations"
        },
        moduleSpecifier: "@webiny/api-headless-cms-ddb-es",
        after: "@webiny/api-headless-cms"
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
        value: `createAdminHeadlessCmsContext({
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
        value: `createAdminHeadlessCmsGraphQL()`,
        after: new RegExp("createAdminHeadlessCmsContext")
    });
};
/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeHeadlessCMS = (project, context) => {
    const checkPath = path.join(context.project.root, "api", "code", "headlessCMS");
    if (!fs.existsSync(checkPath)) {
        return;
    }

    const { info } = context;
    info(`Upgrading ${info.hl(paths.headlessCMS)}`);

    const source = project.getSourceFile(files(context).headlessCMSIndex);

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
        name: ["createContentHeadlessCmsContext", "createContentHeadlessCmsGraphQL"],
        moduleSpecifier: "@webiny/api-headless-cms",
        after: "@webiny/handler-logs"
    });
    insertImportToSourceFile({
        source,
        name: {
            createStorageOperations: "createHeadlessCmsStorageOperations"
        },
        moduleSpecifier: "@webiny/api-headless-cms-ddb-es",
        after: "@webiny/api-headless-cms"
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
        value: `createContentHeadlessCmsContext({
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
        value: `createContentHeadlessCmsGraphQL({debug})`,
        after: new RegExp("createContentHeadlessCmsContext")
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
