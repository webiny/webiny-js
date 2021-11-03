// eslint-disable-next-line
const tsMorph = require("ts-morph");

const { copyFiles, deleteFiles } = require("../fileUtils");
const {
    addPackagesToDependencies,
    addPluginArgumentValueInCreateHandler,
    removeImportFromSourceFile,
    insertImportToSourceFile,
    removePluginFromCreateHandler,
    addDynamoDbDocumentClient,
    findNodeInSource,
    findDefaultExport,
    findReturnStatement
} = require("../utils");

const paths = {
    apiGraphQL: "api/code/graphql",
    apiHeadlessCms: "api/code/headlessCMS",
    appsAdminCode: "apps/admin/code",
    apiPulumiDev: "api/pulumi/dev",
    apiPulumiProd: "api/pulumi/prod"
};

const files = {
    apiGraphQL: `${paths.apiGraphQL}/src/index.ts`,
    apiHeadlessCms: `${paths.apiHeadlessCms}/src/index.ts`,
    appAdminPluginsIndex: `${paths.appsAdminCode}/src/plugins/index.ts`,
    appAdminPluginsSecurity: `${paths.appsAdminCode}/src/plugins/security.ts`,
    appAdminApp: `${paths.appsAdminCode}/src/App.tsx`,
    appAdminWebinyConfig: `${paths.appsAdminCode}/webiny.config.ts`,
    apiPulumiDevIndex: `${paths.apiPulumiDev}/index.ts`,
    apiPulumiProdIndex: `${paths.apiPulumiProd}/index.ts`
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeGraphQLIndex = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(paths.apiGraphQL)}`);

    const source = project.getSourceFile(files.apiGraphQL);
    /**
     * Just copy new security.ts file.
     */
    const copyFileTargets = [
        {
            source: `node_modules/@webiny/cwp-template-aws/template/ddb-es/${paths.apiGraphQL}/src/security.ts`,
            destination: `${paths.apiGraphQL}/src/security.ts`
        }
    ];
    copyFiles(context, copyFileTargets);
    /**
     * API GraphQL package.json
     */
    const packages = {
        /**
         * To be added
         */
        "@webiny/api-admin-users-cognito": context.version,
        "@webiny/api-admin-users-cognito-so-ddb": context.version,
        "@webiny/api-tenancy-so-ddb": context.version,
        "@webiny/api-security-cognito": context.version,
        "@webiny/api-security-so-ddb": context.version,
        /**
         * To be removed
         */
        "@webiny/api-security-admin-users": null,
        "@webiny/api-security-admin-users-cognito": null,
        "@webiny/api-security-admin-users-so-ddb": null,
        "@webiny/api-security-cognito-authentication": null
    };
    addPackagesToDependencies(context, paths.apiGraphQL, packages);
    /**
     * Remove imports that are no longer required.
     */
    for (const key in packages) {
        if (packages[key]) {
            continue;
        }
        removeImportFromSourceFile(source, key);
    }
    /**
     * Find securityPlugins() in createHandler({plugins:[]}) and add the documentClient variable into it: {documentClient}
     */
    addPluginArgumentValueInCreateHandler(source, "handler", "securityPlugins", {
        documentClient: "documentClient"
    });
    /**
     * Remove existing import "@webiny/api-page-builder-import-export-so-ddb"
     */
    removeImportFromSourceFile(source, "@webiny/api-page-builder-import-export-so-ddb");
    /**
     * And then add a new one that will have alias.
     */
    insertImportToSourceFile({
        source,
        moduleSpecifier: "@webiny/api-page-builder-import-export-so-ddb",
        name: {
            createStorageOperations: "createPageImportExportStorageOperations"
        }
    });
    /**
     * Find pageBuilderImportExportPlugins() in createHandler({plugins:[]}) and assign storageOperations alias
     */
    addPluginArgumentValueInCreateHandler(source, "handler", "pageBuilderImportExportPlugins", {
        storageOperations: "createPageImportExportStorageOperations({ documentClient })"
    });
    /**
     * Remove adminUsersPlugins() and securityAdminUsersDynamoDbStorageOperations() from handler plugins
     */
    removePluginFromCreateHandler(source, "handler", "adminUsersPlugins()");
    removePluginFromCreateHandler(
        source,
        "handler",
        "securityAdminUsersDynamoDbStorageOperations()"
    );
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeHeadlessCMSIndex = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(paths.apiHeadlessCms)}`);

    const source = project.getSourceFile(files.apiHeadlessCms);
    /**
     * Just copy new security.ts file.
     */
    const copyFileTargets = [
        {
            source: `node_modules/@webiny/cwp-template-aws/template/ddb-es/${paths.apiHeadlessCms}/src/security.ts`,
            destination: `${paths.apiHeadlessCms}/src/security.ts`
        }
    ];
    copyFiles(context, copyFileTargets);

    const packages = {
        /**
         * To be added
         */
        "@webiny/api-security-cognito": context.version,
        "@webiny/api-security-so-ddb": context.version,
        "@webiny/api-tenancy-so-ddb": context.version,
        /**
         * To be removed
         */
        "@webiny/api-security-admin-users": null,
        "@webiny/api-security-admin-users-so-ddb": null,
        "@webiny/api-security-cognito-authentication": null
    };
    addPackagesToDependencies(context, paths.apiHeadlessCms, packages);
    /**
     * Remove imports that are no longer required.
     */
    for (const key in packages) {
        if (packages[key]) {
            continue;
        }
        removeImportFromSourceFile(source, key);
    }
    /**
     * We need to add the documentClient to the file so it can be used later on.
     */
    addDynamoDbDocumentClient(source);
    /**
     * Find securityPlugins() in createHandler({plugins:[]}) and add the documentClient variable into it: {documentClient}
     */
    addPluginArgumentValueInCreateHandler(source, "handler", "securityPlugins", {
        documentClient: "documentClient"
    });
    /**
     * Find dbPlugins() in in createHandler({plugins:[]}) and add the driver initialization with the existing document client.
     */
    addPluginArgumentValueInCreateHandler(source, "handler", "dbPlugins", {
        driver: "new DynamoDbDriver({ documentClient })"
    });
    /**
     * Remove the securityAdminUsersDynamoDbStorageOperations() plugin from the handler.
     */
    removePluginFromCreateHandler(
        source,
        "handler",
        "securityAdminUsersDynamoDbStorageOperations()"
    );
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeAdminComponents = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(paths.appsAdminCode)}/src/components`);

    const file = `${paths.appsAdminCode}/src/components/getIdentityData.ts`;
    /**
     * Remove the getIdentityFile
     */
    deleteFiles(context, [file]);
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeAdminPlugins = (project, context) => {
    const { info, error } = context;
    info(`Upgrading ${info.hl(files.appAdminPluginsIndex)}`);

    const source = project.getSourceFile(files.appAdminPluginsIndex);
    /**
     * Remove the @webiny/app/types import
     */
    removeImportFromSourceFile(source, "@webiny/app/types");
    /**
     * Import tenancy plugins
     */
    insertImportToSourceFile({
        source,
        name: {
            plugins: "tenancyPlugins"
        },
        moduleSpecifier: "@webiny/app-tenancy",
        after: "@webiny/plugins"
    });
    /**
     * remove the plugins.byType<WebinyInitPlugin>("webiny-init")....
     */
    const pluginsByTypeExpression = source.getFirstDescendant(node => {
        if (tsMorph.Node.isExpressionStatement(node) === false) {
            return false;
        }
        const text = node.getText();
        return text.match("plugins.byType<WebinyInitPlugin>") !== null;
    });
    if (pluginsByTypeExpression) {
        pluginsByTypeExpression.remove();
    }
    /**
     * Then we need to add new tenancy plugins into plugins.register([])
     * And we need to find array expression that represents plugins first.
     */
    const arrayExpression = findNodeInSource(source, [
        {
            matcher: tsMorph.Node.isExpressionStatement,
            error: `Missing "plugins with registering".`
        },
        {
            matcher: tsMorph.Node.isCallExpression,
            info: `Missing "plugins.register" expression.`
        },
        {
            matcher: tsMorph.Node.isArrayLiteralExpression,
            info: `Missing "plugins.register([])" array expression .`
        }
    ]);
    if (!arrayExpression) {
        error(
            `Could not find "plugins.register([])" array expression in given source file "${files.appAdminPluginsIndex}".`
        );
        return;
    }

    /**
     * Find i18nContentPlugins in arrayExpression and add tenancyPlugins()
     */
    let index = 0;
    const i18nContentPlugins = arrayExpression.getElements().some(el => {
        if (tsMorph.Node.isIdentifier(el) === false) {
            return false;
        }
        index++;
        return el.getText() === "i18nContentPlugins";
    });

    if (!i18nContentPlugins) {
        error(
            `Could not find "plugins.register([i18nContentPlugins])" in the array expression in given source file "${files.appAdminPluginsIndex}".`
        );
        return;
    }

    arrayExpression.insertElement(
        index + 1,
        `
	    /**
	     * Tenant installation.
	     */
	    tenancyPlugins(),
	    /**
	     * Security app and authentication plugins.
	    */`
    );
};
/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeAdminSecurity = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(files.appAdminPluginsSecurity)}`);

    const packages = {
        /**
         * To add
         */
        "@webiny/app-security-access-management": context.version,
        "@webiny/app-admin-users-cognito": context.version,
        /**
         * To remove
         */
        "@webiny/app-security-admin-users-cognito": null,
        "@webiny/app-security-admin-users/plugins": null
    };
    addPackagesToDependencies(context, `${paths.appsAdminCode}`, packages);

    const copyFileTargets = [
        {
            source: `node_modules/@webiny/cwp-template-aws/template/common/${files.appAdminPluginsSecurity}`,
            destination: files.appAdminPluginsSecurity
        }
    ];
    copyFiles(context, copyFileTargets);
};
/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeApp = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(files.appAdminApp)}`);

    const copyFileTargets = [
        {
            source: `node_modules/@webiny/cwp-template-aws/template/common/${files.appAdminApp}`,
            destination: files.appAdminApp
        }
    ];
    copyFiles(context, copyFileTargets);

    addPackagesToDependencies(context, paths.appsAdminCode, {
        /**
         * To be added.
         */
        "@webiny/app-admin-users-cognito": context.version,
        "@webiny/app-page-builder-elements": context.version,
        "@webiny/app-security-access-management": context.version,
        /**
         * To be removed.
         */
        "@webiny/app-security-admin-users": null,
        "@webiny/app-security-admin-users-cognito": null
    });
};

/**
 * @param source {tsMorph.SourceFile}
 * @param target {string}
 */
const insertReactAppUserCanChangeEmail = (source, target) => {
    const commandProperty = source.getFirstDescendant(node => {
        if (tsMorph.Node.isMethodDeclaration(node) === false) {
            return false;
        }
        const identifier = node.getFirstDescendant(ident => {
            return tsMorph.Node.isIdentifier(ident) && ident.getText() === target;
        });
        return !!identifier;
    });
    if (!commandProperty) {
        error(`Missing "command.${target}" property in "${files.appAdminWebinyConfig}".`);
        return;
    }
    /**
     *
     * @type {tsMorph.ExpressionStatement}
     */
    const commandExpr = commandProperty.getFirstDescendant(node => {
        if (tsMorph.Node.isExpressionStatement(node) === false) {
            return false;
        }
        return node.getText() === "Object.assign(process.env, output);";
    });
    if (!commandExpr) {
        error(
            `Missing "command.${target}" "Object.assign" expression in "${files.appAdminWebinyConfig}".`
        );
        return;
    }

    source.insertText(
        commandExpr.getEnd() + 1,
        `
        process.env.REACT_APP_ADMIN_USER_CAN_CHANGE_EMAIL = "false";
        `
    );
};
/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradeAppWebinyConfig = (project, context) => {
    const { info } = context;
    info(`Upgrading ${info.hl(files.appAdminWebinyConfig)}`);

    const source = project.getSourceFile(files.appAdminWebinyConfig);
    /**
     * First we need to add the REACT_APP_USER_POOL_PASSWORD_POLICY
     */
    const apiMapDeclaration = source.getFirstDescendant(node => {
        if (tsMorph.Node.isVariableDeclaration(node) === false) {
            return false;
        }
        const apiMapIdentifier = node.getFirstDescendant(identifier => {
            if (tsMorph.Node.isIdentifier(identifier) === false) {
                return false;
            }
            return identifier.getText() === "API_MAP";
        });
        return !!apiMapIdentifier;
    });
    if (!apiMapDeclaration) {
        error(`Missing "API_MAP" declaration in "${files.appAdminWebinyConfig}".`);
        return;
    }
    const expr = apiMapDeclaration.getFirstDescendant(node => {
        return tsMorph.Node.isObjectLiteralExpression(node);
    });
    if (!expr) {
        error(
            `Missing "API_MAP" "ObjectLiteralExpression" declaration in "${files.appAdminWebinyConfig}".`
        );
        return;
    }
    const assigmentExists = expr.getProperty("REACT_APP_USER_POOL_PASSWORD_POLICY");
    if (!assigmentExists) {
        expr.addPropertyAssignment({
            name: "REACT_APP_USER_POOL_PASSWORD_POLICY",
            initializer: '"${cognitoUserPoolPasswordPolicy}"'
        });
    }
    /**
     * And then new env variable in both build and start commands: REACT_APP_ADMIN_USER_CAN_CHANGE_EMAIL = false
     */
    insertReactAppUserCanChangeEmail(source, "start");
    insertReactAppUserCanChangeEmail(source, "build");
};
/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 * @param file {string}
 */
const upgradePulumi = (project, context, file) => {
    const { info, error } = context;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);
    if (!source) {
        error(`Could not locate file "${file}".`);
        return;
    }
    /**
     * We need to find the default export return statement
     */
    const defaultExport = findDefaultExport(source);
    if (!defaultExport) {
        error(`Could not locate default export in file "${file}".`);
        return;
    }

    const returnStatement = findReturnStatement(defaultExport);
    if (!returnStatement) {
        error(`Could not locate return statement in default export in file "${file}".`);
        return;
    }
    /**
     * @type {ObjectLiteralExpression}
     */
    const obj = returnStatement.getFirstDescendant(node =>
        tsMorph.Node.isObjectLiteralExpression(node)
    );
    if (!obj) {
        error(
            `Could not locate object expression return statement in default export in file "${file}".`
        );
        return;
    }

    const prop = obj.getProperty("cognitoUserPoolPasswordPolicy");
    if (!prop) {
        obj.addPropertyAssignment({
            name: "cognitoUserPoolPasswordPolicy",
            initializer: "cognito.userPool.passwordPolicy"
        });
        return;
    }
    prop.setInitializer("cognito.userPool.passwordPolicy");
};

/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradePulumiDev = (project, context) => {
    return upgradePulumi(project, context, files.apiPulumiDevIndex);
};
/**
 * @param project {tsMorph.Project}
 * @param context {CliContext}
 */
const upgradePulumiProd = (project, context) => {
    return upgradePulumi(project, context, files.apiPulumiProdIndex);
};

module.exports = {
    files,
    upgradeGraphQLIndex,
    upgradeHeadlessCMSIndex,
    upgradeAdminComponents,
    upgradeAdminPlugins,
    upgradeAdminSecurity,
    upgradeApp,
    upgradeAppWebinyConfig,
    upgradePulumiDev,
    upgradePulumiProd
};
