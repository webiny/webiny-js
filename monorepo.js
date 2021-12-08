const path = require("path");
const fs = require("fs");

const { getPackages } = require("@lerna/project");
const { filterPackages } = require("@lerna/filter-packages");
const batchPackages = require("@lerna/batch-packages");
const prettier = require("prettier");
const lodash = require("lodash");

const cwd = process.cwd();

run();

async function run() {
    const packages = await getSortedPackages();
    const tsConfigs = await getTsConfigs(packages);
    const prettierConfig = await prettier.resolveConfig(cwd);

    const tsConfig = await loadTsConfig(path.resolve(cwd, "./tsconfig.json"));
    if (tsConfig) {
        processTsReferences({
            tsConfig,
            tsConfigs,
            prettierConfig,
            dependencies: packages
        });
    }

    for (const package of packages) {
        processPackage({
            package,
            packages,
            tsConfigs,
            prettierConfig
        });
    }
}

async function getSortedPackages(scope, ignore) {
    const packages = await getPackages(cwd);
    const filtered = filterPackages(packages, scope, ignore, true);

    return batchPackages(filtered).reduce((arr, batch) => arr.concat(batch), []);
}

async function processPackage({ package, packages, prettierConfig, tsConfigs }) {
    const tsConfig = tsConfigs[package.name];
    if (!tsConfig) {
        // no tsconfig for this package
        return;
    }

    const dependencyNames = [
        ...Object.keys(package.dependencies || {}),
        ...Object.keys(package.devDependencies || {})
    ];
    const dependencies = dependencyNames.map(d => packages.find(p => p.name === d)).filter(d => d);

    await processTsReferences({
        tsConfig,
        dependencies,
        prettierConfig,
        tsConfigs
    });
}

async function processTsReferences({ tsConfig, dependencies, prettierConfig, tsConfigs }) {
    const references = [];

    for (const dep of dependencies) {
        const depTsConfig = tsConfigs[dep.name];
        if (
            !depTsConfig ||
            !depTsConfig.resolved.compilerOptions ||
            !depTsConfig.resolved.compilerOptions.composite
        ) {
            continue;
        }

        let relativePath = path.relative(path.dirname(tsConfig.path), dep.location);
        if (path.sep === "\\") {
            relativePath = relativePath.replace(/\\/g, "/");
        }

        if (!relativePath.startsWith("./") && !relativePath.startsWith("../")) {
            relativePath = "./" + relativePath;
        }

        references.push({
            path: relativePath
        });
    }

    tsConfig.config.references = references;

    let tsConfigJson = JSON.stringify(tsConfig.config, undefined, 2);
    tsConfigJson = prettier.format(tsConfigJson, {
        ...prettierConfig,
        parser: "json"
    });

    await fs.promises.writeFile(tsConfig.path, tsConfigJson, {
        encoding: "utf8"
    });
}

async function getTsConfigs(packages) {
    const configs = {};
    const promises = packages.map(p => loadTsConfigForPackage(configs, p));

    await Promise.all(promises);

    return configs;
}

async function loadTsConfigForPackage(configs, package) {
    try {
        const filePath = path.resolve(package.location, "./tsconfig.json");
        const config = await loadTsConfig(filePath);
        if (!config) {
            return;
        }

        console.log(`Processed ${filePath}`);
        configs[package.name] = config;
    } catch (e) {
        console.error(`Failed to process ${filePath}`, e);
    }
}

async function loadTsConfig(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    try {
        const json = fs.readFileSync(filePath, { encoding: "utf8" });
        const config = JSON.parse(json);
        let resolved = JSON.parse(json);

        while (resolved.extends) {
            const extendsPath = path.resolve(path.dirname(filePath), resolved.extends);
            const extendsJson = fs.readFileSync(extendsPath, { encoding: "utf8" });
            const extendsObj = JSON.parse(extendsJson);

            delete resolved.extends;

            resolved = lodash.merge(extendsObj, resolved);
        }

        return {
            path: filePath,
            config: config,
            resolved: resolved
        };
    } catch (e) {
        console.error(`Error reading file ${filePath}`, e);
        throw e;
    }
}
