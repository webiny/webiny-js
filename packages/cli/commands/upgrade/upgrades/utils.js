const tsMorph = require("ts-morph");
const fs = require("fs");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const semverCoerce = require("semver/functions/coerce");
const execa = require("execa");

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
/**
 * The function expects files to have resolved paths.
 * It will do nothing if file paths are not good.
 */
const prettierRun = async ({ context, files }) => {
    const { info, error } = context;
    try {
        info("Running prettier...");
        const config = context.resolve(".prettierrc.js");
        const { stdout: prettierBin } = await execa("yarn", ["bin", "prettier"]);
        await execa("node", [prettierBin, "--write", "--config", config, ...files]);
        info("Finished formatting files.");
    } catch (ex) {
        console.log(error.hl("Prettier failed."));
        console.log(error(ex.message));
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
        await execa("yarn");
        info("Finished installing new packages.");
    } catch (ex) {
        error("Installation of new packages failed.");
        console.log(error(ex.message));
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
    yarnInstall,
    prettierRun
};
