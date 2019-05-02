const fetch = require("node-fetch");
const glob = require("glob");
const path = require("path");
const { each } = require("lodash");
const execa = require("execa");
const semver = require("semver");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const logger = require("./logger");

async function publishPackages() {
    let currentVersion;
    let location;

    // Get public npm package version
    const pkg = await fetch("https://registry.npmjs.org/webiny-app");
    const { latest: pubLatest } = (await pkg.json())["dist-tags"];

    try {
        // Get private registry package version
        const privPkg = await fetch(`${process.env.REGISTRY}/webiny-app`);
        const { latest: privLatest } = (await privPkg.json())["dist-tags"];
        currentVersion = privLatest;
        location = "private";
    } catch(e) {
        currentVersion = pubLatest;
        location = "public";
    }

    logger.info(`Latest ${location} package version is %s`, `v${currentVersion}`);
    const version = semver.inc(currentVersion, "minor");

    logger.log(`Publishing packages %s`, version);
    const nodeModulesRoot = path.resolve("build/node_modules");

    const paths = glob.sync("webiny-*", { cwd: nodeModulesRoot });

    const updateDeps = (deps, packages, version) => {
        each(deps, (v, dep) => {
            if (packages.includes(dep)) {
                deps[dep] = "^" + version;
            }
        });
    };

    for (let i = 0; i < paths.length; i++) {
        const pkgName = paths[i];
        const packagePath = path.join(nodeModulesRoot, pkgName);
        const pkgJsonPath = path.join(packagePath, "package.json");
        const pkgJson = await loadJsonFile(pkgJsonPath);
        pkgJson.version = version;

        updateDeps(pkgJson.dependencies, paths, version);
        if (pkgJson.devDependencies) {
            updateDeps(pkgJson.devDependencies, paths, version);
        }
        if (pkgJson.peerDependencies) {
            updateDeps(pkgJson.peerDependencies, paths, version);
        }

        await writeJsonFile(pkgJsonPath, pkgJson);

        await runCommand([
            "npm",
            ["publish", "--registry", process.env.REGISTRY],
            { cwd: packagePath }
        ]);

        logger.success("%s", pkgName);
    }
}

async function runCommand(...command) {
    const task = Array.isArray(command[0]) ? execa(...command[0]) : execa(...command);
    return await task;
}

(async () => {
    if (!process.env.REGISTRY) {
        throw new Error("REGISTRY environment variable not found!");
    }
    await publishPackages();
})();
