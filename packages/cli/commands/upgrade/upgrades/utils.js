const tsMorph = require("ts-morph");
const path = require("path");
const fs = require("fs");
const prettier = require("prettier");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const semverCoerce = require("semver/functions/coerce");
const execa = require("execa");
const fsExtra = require("fs-extra");
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
    if (coerced) {
        return true;
    }
    return false;
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
 * @param context {ContextInterface}
 * @param targetPath {string}
 * @param packages {object}
 */
const addPackagesToDependencies = (context, targetPath, packages) => {
    addPackagesToDeps("dependencies", context, targetPath, packages);
};
/**
 * @param context {ContextInterface}
 * @param targetPath {string}
 * @param packages {object}
 */
const addPackagesToDevDependencies = (context, targetPath, packages) => {
    addPackagesToDeps("devDependencies", context, targetPath, packages);
};
/**
 * @param context {ContextInterface}
 * @param targetPath {string}
 * @param packages {object}
 */
const addPackagesToPeerDependencies = (context, targetPath, packages) => {
    addPackagesToDeps("peerDependencies", context, targetPath, packages);
};
/**
 *
 * @param type {string}
 * @param context {ContextInterface}
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
 *
 * @param plugins {tsMorph.Node}
 * @param afterElement {String|undefined}
 * @returns {null|number}
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
 * Timestamp in seconds. Remove the milliseconds.
 * @return {number}
 */
const createCurrentTimestamp = () => {
    return Math.floor(Date.now() / 1000);
};

const validateFileExistence = files => {
    for (const initialFile of files) {
        const file = createFullFile(initialFile);
        if (!fs.existsSync(file)) {
            /**
             * We throw error because if any of the files does not exist, it should not go any further.
             */
            throw new Error(`There is no file "${file}".`);
        }
    }
};

const createBackupFileName = file => {
    const ext = `.${file.split(".").pop()}`;

    const now = createCurrentTimestamp();

    const backup = file.replace(new RegExp(`${ext}$`), `.${now}${ext}`);

    const backupFile = createFullFile(backup);
    if (!fs.existsSync(backupFile)) {
        return backup;
    }
    throw new Error(`Backup file "${backupFile}" already exists.`);
};

const createFullFile = file => {
    return path.join(process.cwd(), file);
};
/**
 *
 * @param context {CliContext}
 * @param initialTargets {{source: string, destination: string}[]}
 */
const copyFiles = (context, initialTargets) => {
    context.info("Copying files...");
    /**
     * First check if source and target files exist and create a backup file name.
     * @type {{source: string, destination: string, backup: string}[]}
     */
    const targets = [];
    for (const target of initialTargets) {
        /**
         *
         */
        validateFileExistence([target.source, target.destination]);
        let backup;
        try {
            backup = createBackupFileName(target.destination);
        } catch (ex) {
            context.error(ex.message);
            process.exit(1);
        }

        targets.push({
            source: target.source,
            destination: target.destination,
            backup
        });
    }
    /**
     * Then:
     * - make backups of the targets files
     * - copy new files to their destinations
     */
    const backups = [];
    context.info("Creating backups...");
    for (const target of targets) {
        try {
            fs.copyFileSync(createFullFile(target.destination), createFullFile(target.backup));
            context.info(`Backed up "${target.destination}" to "${target.backup}".`);
            backups.push(target.backup);
        } catch (ex) {
            context.error(`Could not create backup "${target.destination}" to "${target.backup}".`);
            for (const backup of backups) {
                context.info(`Removing created backup "${backup}".`);
                fs.unlinkSync(createFullFile(backup));
            }
            process.exit(1);
        }
    }

    const files = [];
    context.info("Copying new files...");
    for (const target of targets) {
        try {
            fs.copyFileSync(createFullFile(target.source), createFullFile(target.destination));
            context.info(`Copying new file "${target.source}" to "${target.destination}".`);
            files.push({
                destination: target.destination,
                backup: target.backup
            });
        } catch (ex) {
            context.error(`Could not copy new file "${target.source}" to "${target.destination}".`);
            for (const file of files) {
                context.info(`Restoring backup file "${file.backup}" to "${file.destination}".`);
                fs.copyFileSync(createFullFile(file.backup), createFullFile(file.destination));
                fs.unlinkSync(createFullFile(file.backup));
            }
            process.exit(1);
        }
    }
    context.info("File copying complete!");
};

/**
 * @param context {CliContext}
 * @param targets {{source: string, destination: string}[]}
 */
const copyFolders = (context, targets) => {
    context.info(`Copy folders...`);
    /**
     * First we need to backup existing folders.
     */
    for (const target of targets) {
        const folders = target.destination.split("/");
        const folderName = folders.pop();
        const now = createCurrentTimestamp();
        const backupDestination = folders.concat([`${folderName}_${now}`]).join("/");
        if (fs.existsSync(target.destination) === false) {
            context.info(`No destination "${target.destination}" to backup.`);
            continue;
        }
        fsExtra.copySync(target.destination, backupDestination);
        context.info(`Backed up "${target.destination}" to ${backupDestination}.`);
    }
    /**
     * Delete existing folders.
     */
    for (const target of targets) {
        fsExtra.removeSync(target.destination);
    }
    /**
     * And in the end we need to copy new folders to their destinations.
     */
    for (const target of targets) {
        fsExtra.copySync(target.source, target.destination);
    }
};

/**
 *
 * @param context {CliContext}
 * @param initialTargets {{source: string, destination: string}[]}
 * @param targetVersion {string}
 */
const assignPackageVersions = (context, initialTargets, targetVersion) => {
    const targets = initialTargets
        .filter(target => target.destination.match(/package\.json$/) !== null)
        .map(target => target.destination);
    if (targets.length === 0) {
        return;
    }
    context.info("Assigning proper package versions...");
    for (const target of targets) {
        const file = path.join(process.cwd(), target);
        try {
            const json = JSON.parse(fs.readFileSync(file).toString());
            /**
             *
             * @type {{}}
             */
            json.dependencies = Object.keys(json.dependencies).reduce((dependencies, key) => {
                if (key.match(/^@webiny\//) === null) {
                    dependencies[key] = json.dependencies[key];
                    return dependencies;
                } else if (json.dependencies[key] === "latest") {
                    dependencies[key] = `^${targetVersion}`;
                } else {
                    dependencies[key] = json.dependencies[key];
                }

                return dependencies;
            }, {});
            /**
             *
             */
            if (json.devDependencies) {
                json.devDependencies = Object.keys(json.devDependencies).reduce(
                    (dependencies, key) => {
                        if (key.match(/^@webiny\//) === null) {
                            dependencies[key] = json.devDependencies[key];
                            return dependencies;
                        } else if (json.devDependencies[key] === "latest") {
                            dependencies[key] = `^${targetVersion}`;
                        } else {
                            dependencies[key] = json.devDependencies[key];
                        }

                        return dependencies;
                    },
                    {}
                );
            }
            fs.writeFileSync(file, JSON.stringify(json));
        } catch (ex) {
            console.error(ex.message);
        }
    }
};

module.exports = {
    insertImport,
    addPackagesToDependencies,
    addPackagesToDevDependencies,
    addPackagesToPeerDependencies,
    createMorphProject,
    prettierFormat,
    yarnInstall,
    addImportsToSource,
    assignPackageVersions,
    copyFiles,
    copyFolders
};
