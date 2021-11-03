const tsMorph = require("ts-morph");
const path = require("path");
const fs = require("fs");
const prettier = require("prettier");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const semverCoerce = require("semver/functions/coerce");
const execa = require("execa");
/**
 *
 * @param pkg {string}
 * @param version {string}
 *
 * @return {boolean}
 */
const validateVersion = (pkg, version) => {
    if (version === "latest") {
        return true;
    }
    const coerced = semverCoerce(version);
    return !!coerced;
};
/**
 * @deprecated
 */
const insertImport = (source, name, pkg) => {
    throw new Error("Should not be used anymore.");
    const statements = source.getStatements();
    let importAlreadyExists = false;
    const lastImportStatement = statements.reduce((indexAt, statement, index) => {
        if (statement.getKind() !== tsMorph.SyntaxKind.ImportDeclaration) {
            return indexAt;
        }
        const compilerNode = statement.compilerNode || {};
        const moduleSpecifier = compilerNode.moduleSpecifier || {};
        const importedPackageName = moduleSpecifier.text;
        if (importedPackageName === pkg) {
            importAlreadyExists = true;
        }
        return index > indexAt ? index : indexAt;
    }, -1);
    if (importAlreadyExists) {
        throw new Error(`Package "${pkg}" is already imported.`);
    } else if (lastImportStatement === -1) {
        throw new Error(
            `Could not find last import statement so we can insert new import "${name}"`
        );
    }

    console.log(`Inserting import to position ${lastImportStatement + 1}`);
    source.insertStatements(lastImportStatement + 1, `import ${name} from "${pkg}";`);
};
/**
 *
 * @param context {CliContext}
 * @param targetPath {string}
 * @param packages {object}
 */
const addPackagesToDependencies = (context, targetPath, packages) => {
    addPackagesToDeps("dependencies", context, targetPath, packages);
};
/**
 * @param context {CliContext}
 * @param targetPath {string}
 * @param packages {object}
 */
const addPackagesToDevDependencies = (context, targetPath, packages) => {
    addPackagesToDeps("devDependencies", context, targetPath, packages);
};
/**
 * @param context {CliContext}
 * @param targetPath {string}
 * @param packages {object}
 */
const addPackagesToPeerDependencies = (context, targetPath, packages) => {
    addPackagesToDeps("peerDependencies", context, targetPath, packages);
};
/**
 *
 * @param type {string}
 * @param context {CliContext}
 * @param targetPath {string}
 * @param packages {object}
 */
const allowedPackageDependencyTypes = ["dependencies", "devDependencies", "peerDependencies"];
const addPackagesToDeps = (type, context, targetPath, packages) => {
    if (!allowedPackageDependencyTypes.includes(type)) {
        context.error(`Package dependency type "${type}" is not valid.`);
        return;
    }
    const file = `${targetPath}/package.json`;
    if (!fs.existsSync(file)) {
        context.error(`There is no package.json file at path "${file}".`);
        return;
    }
    const json = loadJson.sync(file);
    if (!json) {
        context.error(`There is no package.json file "${file}"`);
        return;
    }
    const dependencies = json[type] || {};
    for (const pkg in packages) {
        if (!packages.hasOwnProperty(pkg)) {
            continue;
        }
        const version = packages[pkg];

        if (version === null) {
            // Remove package from deps
            delete dependencies[pkg];
            continue;
        }
        if (!validateVersion(pkg, version)) {
            context.error(`Package "${pkg}" version is not a valid semver version: "${version}".`);
            continue;
        }
        dependencies[pkg] = version;
    }
    json[type] = dependencies;

    writeJson.sync(file, json);
};
/**
 * @param files {string[]}
 * @return {tsMorph.Project}
 */
const createMorphProject = files => {
    const project = new tsMorph.Project();
    for (const file of files) {
        project.addSourceFileAtPath(file);
    }
    return project;
};

const prettierFormat = async (files, context) => {
    try {
        context.info("Running prettier...");
        for (const file of files) {
            const filePath = path.join(process.cwd(), file);
            const options = await prettier.resolveConfig(filePath);
            const fileContentRaw = fs.readFileSync(filePath).toString("utf8");
            const fileContentFormatted = prettier.format(fileContentRaw, {
                ...options,
                filepath: filePath
            });
            fs.writeFileSync(filePath, fileContentFormatted);
        }

        context.info("Finished formatting files.");
    } catch (ex) {
        console.log(context.error.hl("Prettier failed."));
        context.error(ex.message);
        if (ex.stdout) {
            console.log(ex.stdout);
        }
    }
};

/**
 * Run to install new packages in the project.
 */
const yarnInstall = async ({ context }) => {
    const { info, error } = context;
    try {
        info("Installing new packages...");
        await execa("yarn", { cwd: process.cwd() });
        info("Finished installing new packages.");
    } catch (ex) {
        error("Installation of new packages failed.");
        console.log(error(ex.message));
        if (ex.stdout) {
            console.log(ex.stdout);
        }
    }
};

/**
 * Run to up the versions of all packages.
 *
 *
 */
const yarnUp = async ({ context, targetVersion }) => {
    const { info, error } = context;
    try {
        info(`Updating all package versions to ${targetVersion}...`);
        await execa(`yarn`, [`up`, `@webiny/*@${targetVersion}`], { cwd: process.cwd() });
        await execa("yarn", { cwd: process.cwd() });
        info("Finished update packages.");
    } catch (ex) {
        error("Updating of the packages failed.");
        console.log(ex);
        console.log(error(ex.message));
        if (ex.stdout) {
            console.log(ex.stdout);
        }
    }
};

/**
 *
 * @param plugins {tsMorph.Node}
 * @param afterElement {String|undefined}
 * @returns {null|number}
 *
 * @deprecated
 */
const findElementIndex = (plugins, afterElement) => {
    if (!afterElement) {
        return null;
    }
    const index = plugins
        .getInitializer()
        .getElements()
        .findIndex(node => {
            return Node.isCallExpression(node) && node.getExpression().getText() === afterElement;
        });
    if (index >= 0) {
        return index;
    }
    return null;
};
/**
 *
 * @param context {CliContext}
 * @param source {tsMorph.SourceFile}
 * @param imports {{elementName: String, importPath: String, afterElement: String | undefined, isImportCallable: boolean, addToPlugins: boolean}[]}
 * @param file {String}
 *
 *
 * @deprecated
 */
const addImportsToSource = ({ context, source, imports, file }) => {
    const { info, warning, error } = context;
    let pluginsElement;
    const getPluginsElement = () => {
        if (pluginsElement) {
            return pluginsElement;
        }
        /**
         * We need the plugins property in the createHandler argument.
         * @type {tsMorph.Node}
         */
        pluginsElement = source.getFirstDescendant(
            node => tsMorph.Node.isPropertyAssignment(node) && node.getName() === "plugins"
        );
        if (!pluginsElement) {
            error(
                `Cannot find "plugins" property of the "createHandler" argument object in ${info.hl(
                    file
                )}.`
            );
        }
        return pluginsElement;
    };

    for (const value of imports) {
        const {
            elementName,
            importPath,
            afterElement,
            afterImport,
            isImportCallable = true,
            addToPlugins = true
        } = value;

        const importDefinition = source.getImportDeclaration(importPath);
        /**
         * If there is required import already, do not proceed.
         * We do not check if imported plugins are actually sent into the handler because we dont know what user might have done.
         */
        if (importDefinition) {
            info(`Import ${info.hl(importPath)} already exists in ${info.hl(file)}.`);
            continue;
        }
        let addedImport = false;
        /**
         * If we need to import after already defined import.
         */
        if (afterImport) {
            const afterImportDeclaration = source.getImportDeclaration(afterImport);
            if (afterImportDeclaration) {
                source.insertImportDeclaration(afterImportDeclaration.getChildIndex() + 1, {
                    defaultImport: elementName,
                    moduleSpecifier: importPath
                });
                addedImport = true;
            } else {
                warning(
                    `Import ${warning.hl(afterImport)} does not exist in ${warning.hl(
                        file
                    )}. Adding new import after the last one.`
                );
            }
        }
        /**
         * If no import was added, add it at the end.
         */
        if (addedImport === false) {
            /**
             * We add the import and after that we add the imported name to the plugins array in the createHandler.
             */
            source.addImportDeclaration({
                defaultImport: elementName,
                moduleSpecifier: importPath
            });
        }
        if (addToPlugins === false) {
            continue;
        }

        const importedElementName = `${elementName}${isImportCallable === false ? "" : "()"}`;

        const plugins = getPluginsElement();
        if (!plugins) {
            error(`Could not add ${error.hl(importedElementName)} to the plugins.`);
            continue;
        }
        /**
         * If after is specified, add the imported value after the one given in the args..
         */
        if (afterElement) {
            const afterIndex = findElementIndex(plugins, afterElement);
            if (afterIndex === null) {
                warning(
                    `Could not find ${warning.hl(
                        after
                    )} of the createHandler.plugins array in ${warning.hl(file)}.`
                );
            } else {
                plugins.getInitializer().insertElement(afterIndex + 1, importedElementName);
                continue;
            }
        }
        /**
         * Add imported plugin at the end of the array as no other options are viable.
         */
        plugins.getInitializer().addElement(importedElementName);
    }
};

/**
 * @param packageJsonPath {String}
 * @param pathsToAdd {String[]}
 */
const addWorkspaceToRootPackageJson = async (packageJsonPath, pathsToAdd) => {
    const rootPackageJson = await loadJson(packageJsonPath);

    pathsToAdd.forEach(pathToAdd => {
        // Ensure forward slashes are used.
        pathToAdd = pathToAdd.replace(/\\/g, "/");
        // Add it to workspaces packages if not already
        if (!rootPackageJson.workspaces.packages.includes(pathToAdd)) {
            rootPackageJson.workspaces.packages.push(pathToAdd);
        }
    });

    await writeJson(packageJsonPath, rootPackageJson);
};

/**
 * @param packageJsonPath {String}
 * @param pathsToRemove {String[]}
 */
const removeWorkspaceToRootPackageJson = async (packageJsonPath, pathsToRemove) => {
    const rootPackageJson = await loadJson(packageJsonPath);

    pathsToRemove.forEach(pathToRemove => {
        // Remove it from workspaces packages if present
        const index = rootPackageJson.workspaces.packages.indexOf(pathToRemove);
        if (index !== -1) {
            rootPackageJson.workspaces.packages.splice(index, 1);
        }
    });

    await writeJson(packageJsonPath, rootPackageJson);
};

/**
 *
 * @param name {string | string[] | Record<string, string>}
 * @return {{name: string, alias: string | undefined}[]|undefined}
 */
const createNamedImports = name => {
    if (typeof name === "string") {
        return undefined;
    } else if (Array.isArray(name) === true) {
        return name.map(n => ({
            name: n
        }));
    }
    return Object.keys(name).map(key => {
        return {
            name: key,
            alias: name[key]
        };
    });
};
/**
 * It is possible to send:
 * - string - will produce default import
 * - string[] - will produce named imports
 * - Record<string, string> - will produce named imports with aliases
 *
 * @param source {tsMorph.SourceFile}
 * @param name {string|string[]|Record<string, string>}
 * @param moduleSpecifier {string}
 * @param after {string|null}
 */
const insertImportToSourceFile = ({ source, name, moduleSpecifier, after = null }) => {
    const namedImports = createNamedImports(name);
    const defaultImport = namedImports === undefined ? name : undefined;

    const declaration = source.getImportDeclaration(moduleSpecifier);

    if (declaration) {
        if (defaultImport) {
            declaration.setDefaultImport(defaultImport);
            return;
        }
        /**
         * We check the existing imports so we dont add the same one.
         */
        const existingNamedImports = declaration.getNamedImports().map(ni => {
            return ni.getText();
        });
        declaration.addNamedImports(
            namedImports.filter(ni => {
                return existingNamedImports.includes(ni.name) === false;
            })
        );
        return;
    }
    /**
     * If we want to add this import after some other import...
     */
    if (after) {
        const afterDeclaration = source.getImportDeclaration(after);
        /**
         * If there is no target import, we will just add it at the end.
         */
        if (afterDeclaration) {
            source.insertImportDeclaration(afterDeclaration.getChildIndex() + 1, {
                defaultImport,
                namedImports,
                moduleSpecifier
            });
            return;
        }
    }

    source.addImportDeclaration({
        defaultImport,
        namedImports,
        moduleSpecifier
    });
};
/**
 *
 * @param source {tsMorph.SourceFile}
 * @param handler {tsMorph.Node}
 * @return {{handlerDeclaration: VariableDeclaration, createHandlerExpression: tsMorph.Node, plugins: tsMorph.Node, arrayExpression: tsMorph.Node}}
 */
const getCreateHandlerExpressions = (source, handler) => {
    /**
     * First, we need to find handler declaration to check if it actually is ok.
     */
    const handlerDeclaration = source.getVariableDeclaration(handler);
    if (!handlerDeclaration) {
        console.log(`Missing handler expression "${handler}".`);
        return {
            handlerDeclaration: null,
            createHandlerExpression: null,
            plugins: null,
            arrayExpression: null
        };
    }
    /**
     * Then we need the handler expression "createHandler" to check if it has plugins defined.
     *
     * @type {Node}
     */
    const createHandlerExpression = handlerDeclaration.getFirstDescendant(
        node =>
            tsMorph.Node.isCallExpression(node) &&
            node.getExpression().getText() === "createHandler"
    );
    if (!createHandlerExpression) {
        console.log(`Missing "createHandler" expression in the handler declaration "${handler}".`);
        return {
            handlerDeclaration,
            createHandlerExpression: null,
            plugins: null,
            arrayExpression: null
        };
    }
    /**
     * And third check step is to determine if we need to upgrade the "createHandler".
     */
    const plugins = createHandlerExpression.getFirstDescendant(
        node => tsMorph.Node.isPropertyAssignment(node) && node.getName() === "plugins"
    );
    if (!plugins) {
        return {
            handlerDeclaration,
            createHandlerExpression,
            plugins,
            arrayExpression: null
        };
    }
    const arrayExpression = plugins.getFirstDescendant(node =>
        tsMorph.Node.isArrayLiteralExpression(node)
    );
    return {
        handlerDeclaration,
        createHandlerExpression,
        plugins,
        arrayExpression
    };
};
/**
 *
 * @param source {tsMorph.SourceFile}
 * @param handler {string}
 */
const upgradeCreateHandlerToPlugins = (source, handler) => {
    const { createHandlerExpression, plugins } = getCreateHandlerExpressions(source, "handler");

    if (plugins) {
        return;
    }

    const args = createHandlerExpression.getArguments().map(a => a.getText());
    if (args.length === 0) {
        console.log(`Missing arguments in handler expression "${handler}".`);
        return;
    }
    /**
     * We need  to remove existing arguments.
     */
    args.forEach(() => createHandlerExpression.removeArgument(0));
    /**
     * And then add the new ones.
     */
    createHandlerExpression.addArgument(
        `{plugins: [${args.join(",")}], http: {debug: process.env.DEBUG === "true"}}`
    );
};
/**
 *
 * @param source {tsMorph.SourceFile}
 * @param handler {string}
 * @param targetPlugin {RegExp|string}
 */
const removePluginFromCreateHandler = (source, handler, targetPlugin) => {
    const { plugins, arrayExpression } = getCreateHandlerExpressions(source, handler);

    if (!plugins) {
        console.log(`Missing plugins in "createHandler" expression "${handler}".`);
        return;
    }
    if (!arrayExpression) {
        console.log(`Missing array literal expression in handler "${handler}".`);
        return;
    }

    const elements = arrayExpression.getElements();
    const removeIndexes = elements
        .map((element, index) => {
            if (element.getText().match(targetPlugin) === null) {
                return null;
            }
            return index;
        })
        .reverse()
        .filter(index => {
            return index !== null;
        });
    for (const index of removeIndexes) {
        arrayExpression.removeElement(index);
    }
};
/**
 * @param source {tsMorph.SourceFile}
 * @param handler {string}
 * @param plugin {string}
 * @param arg {string|Record<string, string>}
 */
const addPluginArgumentValueInCreateHandler = (source, handler, plugin, arg) => {
    const { plugins, arrayExpression } = getCreateHandlerExpressions(source, handler);

    if (!plugins) {
        console.log(`Missing plugins in "createHandler" in handler "${handler}".`);
        return;
    } else if (!arrayExpression) {
        console.log(`Missing array literal expression in "createHandler" in handler "${handler}".`);
        return;
    }
    /**
     * @type {tsMorph.Node}
     */
    const pluginExpression = arrayExpression.getElements().find(element => {
        return element.getText().match(plugin);
    });
    if (!pluginExpression) {
        console.log(
            `Could not find plugin "${plugin}" in "createHandler" in handler "${handler}".`
        );
        return;
    }
    const pluginArguments = pluginExpression.getArguments();
    /**
     * When there are no plugin arguments, we need to add the new one.
     */
    if (pluginArguments.length === 0) {
        /**
         * If arg is array, we need to add as array.
         */
        if (Array.isArray(arg)) {
            pluginExpression.addArgument(`[${arg.join(",")}]`);
            return;
        } else if (typeof arg === "string") {
            pluginExpression.addArgument(`"${arg}"`);
            return;
        }
        const createObjectArgument = args => {
            return Object.keys(args)
                .map(key => {
                    const value = args[key];
                    if (value === key || !value) {
                        return key;
                    }
                    return `${key}:${args[key]}`;
                })
                .join(",");
        };
        if (typeof arg === "object" && Object.keys(arg).length > 0) {
            pluginExpression.addArgument(`{${createObjectArgument(arg)}}`);
        }
        return;
    }
    /**
     * When there are more plugin arguments, we allow only one.
     */
    if (pluginArguments.length > 1) {
        console.log(
            `We allow to upgrade only single argument plugin intializers. Error in "${handler}", plugin "${plugin}".`
        );
        return;
    }

    if (typeof arg === "string" || Array.isArray(arg) === true || typeof arg !== "object") {
        console.log(
            `When handlers "${handler}" plugin "${plugin}" argument already exists, we allow only objects to be added to it.`
        );
        return;
    }
    const [pluginArgument] = pluginArguments;
    /**
     * And that plugin argument MUST be an object.
     */
    if (tsMorph.Node.isObjectLiteralExpression(pluginArgument) === false) {
        console.log(
            `We allow only to upgrade ObjectLiteralExpressions in handler "${handler}" plugin "${plugin}".`
        );
        return;
    }

    for (const key in arg) {
        const prop = pluginArgument.getProperty(key);
        const value = arg[key];
        if (!prop) {
            pluginArgument.addPropertyAssignment({
                name: key,
                /**
                 * If value and key are same or value is null or undefined, do not add the initializer because it is named assign
                 */
                initializer: value === key || !value ? undefined : value
            });
            continue;
        }
        prop.setInitializer(value);
    }
};
/**
 * @param source {tsMorph.SourceFile}
 * @param target {string}
 */
const removeImportFromSourceFile = (source, target) => {
    const importDeclaration = source.getImportDeclaration(target);
    if (!importDeclaration) {
        console.log(`No import declaration with target path "${target}".`);
        return;
    }
    importDeclaration.remove();
};
/**
 * @param source {tsMorph.SourceFile}
 */
const addDynamoDbDocumentClient = source => {
    /**
     * If there is document client declaration, no need to proceed further.
     */
    const documentClient = source.getFirstDescendant(node => {
        return tsMorph.Node.isVariableDeclaration(node) && node.getName() === "documentClient";
    });
    if (documentClient) {
        return;
    }

    const importDeclarations = source.getImportDeclarations();
    const lastImportDeclaration = importDeclarations[importDeclarations.length - 1];
    const last = lastImportDeclaration.getEndLineNumber();

    source.insertVariableStatement(last, {
        declarationKind: tsMorph.VariableDeclarationKind.Const,
        declarations: [
            {
                name: "documentClient",
                initializer:
                    "new DocumentClient({convertEmptyValues: true,region: process.env.AWS_REGION})"
            }
        ]
    });
};
/**
 *
 * @param source {tsMorph.SourceFile}
 * @param targets {({matcher: Function, info: string})[]}
 *
 * @return {tsMorph.ArrayLiteralExpression}
 */
const findNodeInSource = (source, targets) => {
    let previous = source;
    for (const key in targets) {
        const node = previous.getFirstDescendant(node => {
            return targets[key].matcher(node);
        });
        if (!node) {
            return null;
        }
        previous = node;
    }
    return previous;
};
/**
 * @param parent {tsMorph.Node}
 *
 * @return {tsMorph.Node}
 */
const findDefaultExport = parent => {
    const exp = parent.getFirstDescendant(node => {
        if (tsMorph.Node.isExportAssignment(node) === false) {
            return false;
        }
        return node.getText().startsWith("export default (");
    });
    return exp || null;
};
/**
 * @param parent {tsMorph.Node}
 *
 * @return {tsMorph.Node}
 */
const findReturnStatement = parent => {
    const stmt = parent.getFirstDescendant(node => {
        return tsMorph.Node.isReturnStatement(node);
    });
    return stmt || null;
};

module.exports = {
    insertImport,
    addPackagesToDependencies,
    addPackagesToDevDependencies,
    addPackagesToPeerDependencies,
    createMorphProject,
    prettierFormat,
    yarnInstall,
    yarnUp,
    addImportsToSource,
    addWorkspaceToRootPackageJson,
    removeWorkspaceToRootPackageJson,
    insertImportToSourceFile,
    upgradeCreateHandlerToPlugins,
    removePluginFromCreateHandler,
    addPluginArgumentValueInCreateHandler,
    removeImportFromSourceFile,
    addDynamoDbDocumentClient,
    findNodeInSource,
    findDefaultExport,
    findReturnStatement
};
