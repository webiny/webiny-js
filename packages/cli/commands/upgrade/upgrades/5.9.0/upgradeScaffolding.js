const fs = require("fs");
const path = require("path");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const { addPackagesToDevDependencies } = require("../utils");
const { Project, Node } = require("ts-morph");
const { log } = require("@webiny/cli/utils");

/**
 * Applies a couple of changes related to new scaffolds and DX improvements.
 * @param context
 * @param targetVersion
 * @returns {Promise<void>}
 */
const upgradeScaffolding = async (context, targetVersion) => {
    // Base paths.
    const gqlPath = path.join(context.project.root, "api", "code", "graphql");
    const cmsPath = path.join(context.project.root, "api", "code", "headlessCMS");

    // GraphQL & Headless CMS - create ".babelrc.js" and "jest.config.js" files.
    [gqlPath, cmsPath].forEach(appPath => cpBabelRcJestConfig(appPath));

    // Add support for importing packages via "~".
    updateTsConfigWithSupportForTildeImports(path.join(gqlPath, "tsconfig.json"));
    updateTsConfigWithSupportForTildeImports(path.join(cmsPath, "tsconfig.json"));

    // Edit jest.config.base.js - enable running tests from any folder by adding "**".
    updateJestConfigBase(path.join(context.project.root, "jest.config.base.js"));

    // Add @webiny/cli-plugin-deploy-pulumi to "devDependencies".
    addCliPluginDeployPulumiToDevDeps(gqlPath, targetVersion);
    addCliPluginDeployPulumiToDevDeps(cmsPath, targetVersion);

    addCrossEnvToRootDevDeps(context.project.root);

    // Create new scaffolds folder and index.ts file.
    createScaffoldsFolder(path.join(gqlPath, "src", "plugins", "scaffolds"));
    createScaffoldsFolder(path.join(cmsPath, "src", "plugins", "scaffolds"));

    // Import "scaffoldsPlugins" in "index.ts" file.
    await addScaffoldsPlugins(path.join(gqlPath, "src/index.ts"));
    await addScaffoldsPlugins(path.join(cmsPath, "src/index.ts"));

    // Make sure "dynamoDbTable: dynamoDb.table.name" is exported in the exported object.
    await addDynamoDbTableExport(
        path.join(context.project.root, "api", "pulumi", "dev", "index.ts")
    );

    await addDynamoDbTableExport(
        path.join(context.project.root, "api", "pulumi", "prod", "index.ts")
    );
};

/**
 * Add @webiny/cli-plugin-deploy-pulumi to "devDependencies".
 * @param appPath
 * @param targetVersion
 */
const addCliPluginDeployPulumiToDevDeps = (appPath, targetVersion) => {
    const { info, error } = log;

    const name = "@webiny/cli-plugin-deploy-pulumi";
    const packageJsonPath = path.join(appPath, "package.json");

    try {
        info(`Adding ${info.hl(name)} to ${info.hl(packageJsonPath)}...`);
        addPackagesToDevDependencies(appPath, {
            "@webiny/cli-plugin-deploy-pulumi": `^${targetVersion}`
        });
    } catch (e) {
        error(`Failed adding ${info.hl(name)} to ${info.hl(packageJsonPath)}:`);
        console.log(e);
    }
};

/**
 * Add `"cross-env": "^5.0.2"` to root package.json.
 * @param projectRootPath
 */
const addCrossEnvToRootDevDeps = projectRootPath => {
    const { info, error } = log;

    const name = "cross-env";
    const targetVersion = "^5.0.2";

    const packageJsonPath = path.join(projectRootPath, "package.json");

    try {
        info(`Adding ${info.hl(name)} to ${info.hl(packageJsonPath)}...`);
        addPackagesToDevDependencies(projectRootPath, {
            [name]: targetVersion
        });
    } catch (e) {
        error(`Failed adding ${info.hl(name)} to ${info.hl(packageJsonPath)}:`);
        console.log(e);
    }
};

/**
 * Edit jest.config.base.js - enable running tests from any folder by adding "**".
 * @param jestConfigBasePath
 */
const updateJestConfigBase = jestConfigBasePath => {
    const { info, error, warning } = log;

    try {
        let jestConfigBase = fs.readFileSync(jestConfigBasePath).toString("utf8");

        if (jestConfigBase.includes("testMatch: [`${path}/**/__tests__")) {
            warning(
                `Skipping updating ${warning.hl(jestConfigBasePath)} - changes already applied.`
            );
            return;
        }

        info(`Updating ${info.hl(jestConfigBasePath)}...`);
        jestConfigBase = jestConfigBase.replace(
            `const name = basename(path);`,
            "const name = basename(path);\n" +
                `    // Enables us to run tests of only a specific type (for example "integration" or "e2e").
    let type = "";
    if (process.env.TEST_TYPE) {
        type = \`.${process.env.TEST_TYPE}\`;
    }`
        );

        jestConfigBase = jestConfigBase.replace(
            "testMatch: [`${path}/__tests__/**/*.test.[jt]s?(x)`],",
            "testMatch: [`${path}/**/__tests__/**/*${type}.test.[jt]s?(x)`],"
        );

        fs.writeFileSync(jestConfigBasePath, jestConfigBase);
    } catch (e) {
        error(`Failed updating ${error.hl(jestConfigBasePath)}:`);
        console.log(e);
    }
};

/**
 * Copy/paste new ".babelrc.js" and "jest.config.js" files.
 * @param appPath
 */
const cpBabelRcJestConfig = appPath => {
    const filesFolder = path.join(__dirname, "upgradeScaffolding");
    const { info, error, warning } = log;

    const babelRcPath = path.join(appPath, ".babelrc.js");
    try {
        if (fs.existsSync(babelRcPath)) {
            warning(`Skipping creation of ${warning.hl(babelRcPath)} - already exists.`);
        } else {
            info(`Creating ${info.hl(babelRcPath)}...`);
            fs.copyFileSync(path.join(filesFolder, "babelrc.js"), babelRcPath);
        }
    } catch (e) {
        error(`Failed creating ${error.hl(babelRcPath)}:`);
        console.log(e);
    }

    const jestConfigPath = path.join(appPath, "jest.config.js");
    try {
        if (fs.existsSync(jestConfigPath)) {
            warning(`Skipping creation of ${warning.hl(jestConfigPath)} - already exists.`);
        } else {
            info(`Creating ${info.hl(jestConfigPath)}...`);
            fs.copyFileSync(path.join(filesFolder, "jestConfig.js"), jestConfigPath);
        }
    } catch (e) {
        error(`Failed creating ${error.hl(jestConfigPath)}:`);
        console.log(e);
    }
};

/**
 * Add support for importing packages via "~".
 * @param tsConfigPath
 */
const updateTsConfigWithSupportForTildeImports = tsConfigPath => {
    const { info, error } = log;

    // Add support for importing packages via "~".
    try {
        info(`Updating ${info.hl(tsConfigPath)}...`);
        let tsConfig = loadJsonFile.sync(tsConfigPath);
        if (!tsConfig) {
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
    } catch (e) {
        error(`Failed updating ${error.hl(tsConfigPath)}:`);
        console.log(e);
    }
};

/**
 * Make sure "dynamoDbTable: dynamoDb.table.name" is exported in the exported object.
 * @param filePath
 * @returns {Promise<*>}
 */
const addDynamoDbTableExport = async filePath => {
    const { info, error, warning } = log;

    try {
        const content = fs.readFileSync(filePath).toString("utf8");
        if (content.includes("dynamoDbTable: dynamoDb.table.name")) {
            warning(
                `Skipping adding ${warning.hl(
                    "dynamoDbTable: dynamoDb.table.name"
                )} to ${warning.hl(filePath)} - changes already applied.`
            );

            return;
        }

        info(`Adding ${info.hl("dynamoDbTable: dynamoDb.table.name")} to ${info.hl(filePath)}...`);

        const project = new Project();
        project.addSourceFileAtPath(filePath);

        const source = project.getSourceFileOrThrow(filePath);

        const defaultExport = source.getFirstDescendant(node => Node.isExportAssignment(node));
        const arrowFunction = defaultExport.getFirstDescendant(node => Node.isArrowFunction(node));
        const returnStatement = arrowFunction.getFirstDescendant(node =>
            Node.isReturnStatement(node)
        );
        const returnObjectLiteral = returnStatement.getFirstChild(node =>
            Node.isObjectLiteralExpression(node)
        );

        returnObjectLiteral.insertProperty(0, "dynamoDbTable: dynamoDb.table.name");

        return source.save();
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
 * @returns {Promise<*>}
 */
const addScaffoldsPlugins = async indexPath => {
    const { info, error, warning } = log;

    try {
        const content = fs.readFileSync(indexPath).toString("utf8");
        if (content.includes("scaffoldsPlugins")) {
            warning(
                `Skipping importing and adding ${warning.hl("scaffoldsPlugins")} in ${warning.hl(
                    indexPath
                )} - changes already applied.`
            );
            return;
        }

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

        return source.save();
    } catch (e) {
        error(
            `Failed importing and adding ${error.hl("scaffoldsPlugins")} in ${error.hl(indexPath)}:`
        );
        console.log(e);
    }
};

const content = `// This file is automatically updated via various scaffolding utilities.

export default () => [];`;

const createScaffoldsFolder = folder => {
    fs.mkdirSync(folder, { recursive: true });
    const indexPath = path.join(folder, "index.ts");
    if (fs.existsSync(indexPath)) {
        return;
    }

    fs.writeFileSync(indexPath, content);
};

module.exports = {
    upgradeScaffolding
};
