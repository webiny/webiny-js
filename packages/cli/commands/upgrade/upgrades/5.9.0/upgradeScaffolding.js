const fs = require("fs");
const path = require("path");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const { addPackagesToDevDependencies } = require("../utils");
import { Project, Node } from "ts-morph";

const upgradeScaffolding = async context => {
    // Base paths.
    const gqlPath = path.join(context.project.root, "api", "code", "graphql");
    const cmsPath = path.join(context.project.root, "api", "code", "headlessCMS");

    // GraphQL & Headless CMS - create ".babelrc.js" and "jest.config.js" files.
    [gqlPath, cmsPath].forEach(appPath => cpBabelRcJestConfig(appPath, context));

    // Add support for importing packages via "~".
    updateTsConfigWithSupportForTildeImports(path.join(gqlPath, "tsconfig.json"));
    updateTsConfigWithSupportForTildeImports(path.join(cmsPath, "tsconfig.json"));

    // Edit jest.config.base.js - enable running tests from any folder by adding "**".
    updateJestConfigBase(context);

    // Add @webiny/cli-plugin-deploy-pulumi to "devDependencies".
    addCliPluginDeployPulumiToDevDeps(gqlPath, context);
    addCliPluginDeployPulumiToDevDeps(cmsPath, context);

    // Import "scaffoldsPlugins" in "index.ts" file.
    await addScaffoldsPlugins(path.join(gqlPath, "src/index.ts"), context);
    await addScaffoldsPlugins(path.join(cmsPath, "src/index.ts"), context);

    // Make sure "dynamoDbTable: dynamoDb.table.name" is exported in the exported object.
    await addDynamoDbTableExport(
        path.join(context.project.root, "api", "pulumi", "dev", "index.ts"),
        context
    );
    await addDynamoDbTableExport(
        path.join(context.project.root, "api", "pulumi", "prod", "index.ts"),
        context
    );
};

/**
 * Add @webiny/cli-plugin-deploy-pulumi to "devDependencies".
 * @param appPath
 * @param context
 */
const addCliPluginDeployPulumiToDevDeps = (appPath, context) => {
    const { info, error, success } = context.log;

    const name = "@webiny/cli-plugin-deploy-pulumi";
    const packageJsonPath = path.join(appPath, "package.json");

    try {
        info(`Adding ${info.hl(name)} to ${info.hl(packageJsonPath)}...`);
        addPackagesToDevDependencies(appPath, {
            "@webiny/cli-plugin-deploy-pulumi": `^${context.version}`
        });
        success(`Successfully added ${info.hl(name)} to ${info.hl(packageJsonPath)}.`);
    } catch (e) {
        error(`Failed adding ${info.hl(name)} to ${info.hl(packageJsonPath)}:`);
        console.log(e);
    }
};

/**
 * Edit jest.config.base.js - enable running tests from any folder by adding "**".
 * @param context
 */
const updateJestConfigBase = context => {
    const { info, error, success } = context.log;
    const jestConfigBasePath = path.join(context.project.root, "jest.config.base.js");

    try {
        info(`Updating ${info.hl(jestConfigBasePath)}...`);
        const jestConfigBase = fs.readFileSync(jestConfigBasePath).toString("utf8");

        jestConfigBase.replace(
            "testMatch: [`${path}/__tests__/**/*.test.[jt]s?(x)`],",
            "testMatch: [`${path}/**/__tests__/**/*${type}.test.[jt]s?(x)`],"
        );

        fs.writeFileSync(jestConfigBasePath, jestConfigBase);
        success(`Successfully updated ${success.hl(jestConfigBasePath)}.`);
    } catch (e) {
        error(`Failed updating ${error.hl(jestConfigBasePath)}:`);
        console.log(e);
    }
};

const cpBabelRcJestConfig = (appPath, context) => {
    const filesFolder = path.join(__dirname, "upgradeScaffolding");
    const { info, error, success } = context.log;

    const babelRcPath = path.join(appPath, ".babelrc.js");
    try {
        if (fs.existsSync(babelRcPath)) {
            info(`Skipping creation of ${info.hl(babelRcPath)} - already exists.`);
        } else {
            info(`Creating ${info.hl(babelRcPath)}...`);
            fs.copyFileSync(path.join(filesFolder, "babelrc.js"), babelRcPath);
            success(`Successfully created ${success.hl(babelRcPath)}.`);
        }
    } catch (e) {
        error(`Failed creating ${error.hl(babelRcPath)}:`);
        console.log(e);
    }

    const jestConfigPath = path.join(appPath, "jest.config.js");
    try {
        if (fs.existsSync(jestConfigPath)) {
            info(`Skipping creation of ${info.hl(jestConfigPath)} - already exists.`);
        } else {
            info(`Creating ${info.hl(jestConfigPath)}...`);
            fs.copyFileSync(path.join(filesFolder, "jestConfig.js"), jestConfigPath);
            success(`Successfully created ${success.hl(jestConfigPath)}.`);
        }
    } catch (e) {
        error(`Failed creating ${error.hl(jestConfigPath)}:`);
        console.log(e);
    }
};

/**
 * Add support for importing packages via "~".
 * @param tsConfigPath
 * @param context
 */
const updateTsConfigWithSupportForTildeImports = (tsConfigPath, context) => {
    const { info, error, success } = context.log;

    // Add support for importing packages via "~".
    try {
        info(`Updating ${info.hl(tsConfigPath)}...`);

        let tsConfig = loadJsonFile.sync(tsConfigPath);
        if (tsConfig) {
            tsConfig = {};
        }

        if (!tsConfig.compilerOptions) {
            tsConfig.compilerOptions = {};
        }

        if (!tsConfig.compilerOptions.baseUrl) {
            tsConfig.compilerOptions.baseUrl = ".";
        }

        if (!tsConfig.compilerOptions.paths) {
            tsConfig.compilerOptions.paths = {};
        }

        if (!tsConfig.compilerOptions.paths["~/*"]) {
            tsConfig.compilerOptions.paths["~/*"] = ["./src/*"];
        }

        writeJsonFile.sync(tsConfigPath, tsConfig);
        success(`Successfully updated ${success.hl(tsConfigPath)}.`);
    } catch (e) {
        error(`Failed updating ${error.hl(tsConfigPath)}:`);
        console.log(e);
    }
};

/**
 * Make sure "dynamoDbTable: dynamoDb.table.name" is exported in the exported object.
 * @param filePath
 * @param context
 * @returns {Promise<*>}
 */
const addDynamoDbTableExport = async (filePath, context) => {
    const { info, error, success } = context.log;

    try {
        info(`Adding ${info.hl("dynamoDbTable: dynamoDb.table.name")} to ${info.hl(filePath)}...`);

        const project = new Project();
        project.addSourceFileAtPath(filePath);

        const source = project.getSourceFileOrThrow(filePath);

        // If import declaration exists, exit.
        const defaultExport = source.getFirstDescendant(node => Node.isExportAssignment(node));
        const arrowFunction = defaultExport.getFirstDescendant(node => Node.isArrowFunction(node));
        const returnStatement = arrowFunction.getFirstDescendant(node =>
            Node.isReturnStatement(node)
        );
        const returnObjectLiteral = returnStatement.getFirstChild(node =>
            Node.isObjectLiteralExpression(node)
        );

        returnObjectLiteral.insertProperty(0, "dynamoDbTable: dynamoDb.table.name");

        return source
            .save()
            .then(() =>
                success(
                    `Successfully added ${success.hl(
                        "dynamoDbTable: dynamoDb.table.name"
                    )} to ${success.hl(filePath)}.`
                )
            );
    } catch (e) {
        error(
            `Failed adding ${error.hl("dynamoDbTable: dynamoDb.table.name")} to ${error.hl(
                filePath
            )}:`
        );
        console.log(e);
    }
};

/**
 * Import "scaffoldsPlugins" in "index.ts" file.
 * @param indexPath
 * @param context
 * @returns {Promise<*>}
 */
const addScaffoldsPlugins = async (indexPath, context) => {
    const { info, error, success } = context.log;

    try {
        info(`Importing and adding ${info.hl("scaffoldsPlugins")} in ${info.hl(indexPath)}...`);

        const project = new Project();
        project.addSourceFileAtPath(indexPath);

        const source = project.getSourceFileOrThrow(indexPath);

        // If import declaration exists, exit.
        if (source.getImportDeclaration("./plugins/scaffolds")) {
            return;
        }

        let index = 1;

        const importDeclarations = source.getImportDeclarations();
        const lastImportDeclaration = importDeclarations[importDeclarations.length - 1];
        index = lastImportDeclaration.getChildIndex() + 1;

        source.insertImportDeclaration(index, {
            defaultImport: "scaffoldsPlugins",
            moduleSpecifier: "./plugins/scaffolds"
        });

        const pluginsObject = source.getFirstDescendant(node => {
            if (Node.isPropertyAssignment(node) && node.getName() === "plugins") {
                return node;
            }
        });

        const pluginsArray = pluginsObject.getInitializer();
        pluginsArray.addElement("scaffoldsPlugins()");

        return source
            .save()
            .then(() =>
                success(
                    `Successfully imported and added ${success.hl(
                        "scaffoldsPlugins"
                    )} in ${success.hl(indexPath)}...`
                )
            );
    } catch (e) {
        error(
            `Failed importing and adding ${error.hl("scaffoldsPlugins")} in ${error.hl(indexPath)}:`
        );
        console.log(e);
    }
};

module.exports = {
    upgradeScaffolding
};
