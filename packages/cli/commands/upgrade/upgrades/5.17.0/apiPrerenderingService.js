// eslint-disable-next-line
const tsMorph = require("ts-morph");

const {
    insertImportToSourceFile,
    addPackagesToDependencies,
    removeImportFromSourceFile,
    upgradeCreateHandlerToPlugins,
    removePluginFromCreateHandler,
    addPluginArgumentValueInCreateHandler,
    addDynamoDbDocumentClient
} = require("../utils");
const path = require("path");

const paths = {
    flush: "api/code/prerenderingService/flush",
    queueAdd: "api/code/prerenderingService/queue/add",
    queueProcess: "api/code/prerenderingService/queue/process",
    render: "api/code/prerenderingService/render"
};

const files = {
    flush: `${paths.flush}/src/index.ts`,
    queueAdd: `${paths.queueAdd}/src/index.ts`,
    queueProcess: `${paths.queueProcess}/src/index.ts`,
    render: `${paths.render}/src/index.ts`
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeFlush = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(files.flush)}`);

    const source = project.getSourceFile(files.flush);

    addPackagesToDependencies(context, path.resolve(process.cwd(), paths.flush), {
        "@webiny/api-page-builder-so-ddb-es": context.version
    });

    addDynamoDbDocumentClient(source);

    removeImportFromSourceFile(source, "@webiny/db-dynamodb");
    removeImportFromSourceFile(source, "@webiny/handler-db");

    insertImportToSourceFile({
        source,
        name: ["createPrerenderingServiceStorageOperations"],
        moduleSpecifier: "@webiny/api-prerendering-service-so-ddb"
    });

    upgradeCreateHandlerToPlugins(source, "handler");

    removePluginFromCreateHandler(source, "handler", new RegExp(/^dbPlugins\(\{/));

    addPluginArgumentValueInCreateHandler(source, "handler", "flushPlugins", {
        storageOperations:
            "createPrerenderingServiceStorageOperations({documentClient, table: table => ({ ...table, name: process.env.DB_TABLE })})"
    });
};
/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeQueueAdd = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(files.queueAdd)}`);

    const source = project.getSourceFile(files.queueAdd);

    addPackagesToDependencies(context, path.resolve(process.cwd(), paths.queueAdd), {
        "@webiny/api-page-builder-so-ddb-es": context.version
    });

    addDynamoDbDocumentClient(source);

    removeImportFromSourceFile(source, "@webiny/db-dynamodb");
    removeImportFromSourceFile(source, "@webiny/handler-db");

    insertImportToSourceFile({
        source,
        name: ["createPrerenderingServiceStorageOperations"],
        moduleSpecifier: "@webiny/api-prerendering-service-so-ddb"
    });

    upgradeCreateHandlerToPlugins(source, "handler");

    removePluginFromCreateHandler(source, "handler", new RegExp(/^dbPlugins\(\{/));

    addPluginArgumentValueInCreateHandler(source, "handler", "queueAddPlugins", {
        storageOperations:
            "createPrerenderingServiceStorageOperations({documentClient, table: table => ({ ...table, name: process.env.DB_TABLE })})"
    });
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeQueueProcess = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(files.queueProcess)}`);

    const source = project.getSourceFile(files.queueProcess);

    addPackagesToDependencies(context, path.resolve(process.cwd(), paths.queueProcess), {
        "@webiny/api-page-builder-so-ddb-es": context.version
    });

    addDynamoDbDocumentClient(source);

    removeImportFromSourceFile(source, "@webiny/db-dynamodb");
    removeImportFromSourceFile(source, "@webiny/handler-db");

    insertImportToSourceFile({
        source,
        name: ["createPrerenderingServiceStorageOperations"],
        moduleSpecifier: "@webiny/api-prerendering-service-so-ddb"
    });

    upgradeCreateHandlerToPlugins(source, "handler");

    removePluginFromCreateHandler(source, "handler", new RegExp(/^dbPlugins\(\{/));

    addPluginArgumentValueInCreateHandler(source, "handler", "queueProcessPlugins", {
        storageOperations:
            "createPrerenderingServiceStorageOperations({documentClient, table: table => ({ ...table, name: process.env.DB_TABLE })})"
    });
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeRender = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(files.render)}`);

    const source = project.getSourceFile(files.render);

    addPackagesToDependencies(context, path.resolve(process.cwd(), paths.render), {
        "@webiny/api-page-builder-so-ddb-es": context.version
    });

    addDynamoDbDocumentClient(source);

    removeImportFromSourceFile(source, "@webiny/db-dynamodb");
    removeImportFromSourceFile(source, "@webiny/handler-db");

    insertImportToSourceFile({
        source,
        name: ["createPrerenderingServiceStorageOperations"],
        moduleSpecifier: "@webiny/api-prerendering-service-so-ddb"
    });

    upgradeCreateHandlerToPlugins(source, "handler");

    removePluginFromCreateHandler(source, "handler", new RegExp(/^dbPlugins\(\{/));

    addPluginArgumentValueInCreateHandler(source, "handler", "renderPlugins", {
        storageOperations:
            "createPrerenderingServiceStorageOperations({documentClient, table: table => ({ ...table, name: process.env.DB_TABLE })})"
    });
};

module.exports = {
    files,
    upgradeFlush,
    upgradeQueueAdd,
    upgradeQueueProcess,
    upgradeRender
};
