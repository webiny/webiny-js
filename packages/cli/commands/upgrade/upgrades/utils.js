const tsMorph = require("ts-morph");
const path = require("path");
const fs = require("fs");
const prettier = require("prettier");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const semverCoerce = require("semver/functions/coerce");

const insertImport = (source, name, pkg) => {
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
 * @param targetPath {string}
 * @param packages {object}
 */
const addPackagesToDependencies = (targetPath, packages) => {
    addPackagesToDeps("dependencies", targetPath, packages);
};
/**
 *
 * @param targetPath {string}
 * @param packages {object}
 */
const addPackagesToDevDependencies = (targetPath, packages) => {
    addPackagesToDeps("devDependencies", targetPath, packages);
};
/**
 *
 * @param targetPath {string}
 * @param packages {object}
 */
const addPackagesToPeerDependencies = (targetPath, packages) => {
    addPackagesToDeps("peerDependencies", targetPath, packages);
};
/**
 *
 * @param type {string}
 * @param targetPath {string}
 * @param packages {object}
 */
const allowedPackageDependencyTypes = ["dependencies", "devDependencies", "peerDependencies"];
const addPackagesToDeps = (type, targetPath, packages) => {
    if (!allowedPackageDependencyTypes.includes(type)) {
        throw new Error(`Package dependency type "${type}" is not valid.`);
    }
    const file = `${targetPath}/package.json`;
    if (!fs.existsSync(file)) {
        throw new Error(`There is no package.json file at path "${file}".`);
    }
    const json = loadJson.sync(file);
    if (!json) {
        throw new Error(`There is no package.json file "${file}"`);
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
        } else {
            const coerced = semverCoerce(version);
            if (!coerced) {
                throw new Error(
                    `Package "${pkg}" version is not a valid semver version: "${version}".`
                );
            }
            dependencies[pkg] = version;
        }
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

module.exports = {
    insertImport,
    addPackagesToDependencies,
    addPackagesToDevDependencies,
    addPackagesToPeerDependencies,
    createMorphProject,
    prettierFormat
};
