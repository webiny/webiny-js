#!/usr/bin/env node
const { getPackages } = require("./utils/getPackages");
const { hashElement } = require("folder-hash");
const fs = require("fs-extra");
const execa = require("execa");
const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const { green, red } = require("chalk");
require("@webiny/cli");
const argv = require("yargs").argv;

const CACHE_FOLDER_PATH = ".webiny/cached-packages";
const META_FILE_PATH = path.join(CACHE_FOLDER_PATH, "meta.json");

(async () => {
    try {
        await require("./linkWorkspaces");

        const start = new Date();
        await build();

        await require("./linkWorkspaces");

        const duration = (new Date() - start) / 1000;
        console.log(`Done! Finished in ${green(duration + "s")}.`);
    } catch (e) {
        console.log(red("An error occurred while executing the command:"));
        console.log(e.message);
        process.exit(1);
    }
})();

function getBuildOutputFolder({ packageJson, packageFolder }) {
    const webinyConfig = packageJson.webiny;
    // `dist` is the default output folder for v5 packages.
    let buildFolder = "dist";
    if (webinyConfig) {
        // Until the need arises, let's just use the default `lib` folder.
        buildFolder = "lib";
    }

    return path.join(packageFolder, buildFolder);
}

async function build() {
    let metaJson = { packages: {} };
    try {
        metaJson = loadJson.sync(META_FILE_PATH);
    } catch {}

    const packagesNoCache = [];
    const packagesUseCache = [];

    const workspacesPackages = getPackages({ includes: ["/packages/"] }).filter(item => item.isTs);

    console.log(`There is a total of ${green(workspacesPackages.length)} packages.`);
    const useCache = argv.hasOwnProperty("cache") ? argv.cache : true;

    // 1. Determine for which packages we can use the cached built code, and for which we need to execute build.
    if (!useCache) {
        workspacesPackages.forEach(pkg => packagesNoCache.push(pkg));
    } else {
        for (const workspacePackage of workspacesPackages) {
            const cacheFolderPath = getPackageCacheFolderPath(workspacePackage);
            if (!fs.existsSync(cacheFolderPath)) {
                packagesNoCache.push(workspacePackage);
                continue;
            }

            const sourceHash = await getPackageSourceHash(workspacePackage);

            const packageMeta = metaJson.packages[workspacePackage.packageJson.name] || {};

            if (packageMeta.sourceHash === sourceHash) {
                packagesUseCache.push(workspacePackage);
            } else {
                packagesNoCache.push(workspacePackage);
            }
        }
    }

    // 2. Let's use cached built code where possible.
    if (packagesUseCache.length) {
        if (packagesUseCache.length > 10) {
            console.log(`Using cache for ${green(packagesUseCache.length)} packages.`);
            console.log(
                `To build all packages regardless of cache, use the ${green("--no-cache")} flag.`
            );
        } else {
            console.log("Using cache for following packages:");
            for (let i = 0; i < packagesUseCache.length; i++) {
                const item = packagesUseCache[i];
                console.log(green(item.packageJson.name));
            }
        }

        for (let i = 0; i < packagesUseCache.length; i++) {
            const workspacePackage = packagesUseCache[i];
            const cacheFolderPath = path.join(CACHE_FOLDER_PATH, workspacePackage.packageJson.name);
            fs.copySync(cacheFolderPath, getBuildOutputFolder(workspacePackage));
        }
    } else {
        if (useCache) {
            console.log("Cache is empty, all packages need to be built.");
        } else {
            console.log("Skipping cache.");
        }
    }

    // 3. Where needed, let's build and update the cache.
    if (packagesNoCache.length === 0) {
        console.log("There are no packages that need to be built.");
        return;
    }

    console.log();

    if (packagesNoCache.length > 10) {
        console.log(`Running build for ${green(packagesNoCache.length)} packages.`);
    } else {
        console.log("Running build for the following packages:");
        for (let i = 0; i < packagesNoCache.length; i++) {
            const item = packagesNoCache[i];
            console.log(`‣ ${green(item.packageJson.name)}`);
        }
    }

    // Building all packages - we're respecting the dependency graph.
    // Note: lists only packages in "packages" folder (check `lerna.json` config).
    const rawPackagesList = await execa("lerna", ["list", "--toposort", "--graph", "--all"]).then(
        ({ stdout }) => JSON.parse(stdout)
    );

    const packagesList = {};
    for (const packageName in rawPackagesList) {
        // If in cache, skip.
        if (packagesUseCache.find(item => item.name === packageName)) {
            continue;
        }

        // If not a TS package, skip.
        if (!workspacesPackages.find(item => item.name === packageName)) {
            continue;
        }

        packagesList[packageName] = rawPackagesList[packageName];
    }

    const batches = [[]];
    for (const packageName in packagesList) {
        const dependencies = packagesList[packageName];
        const latestBatch = batches[batches.length - 1];
        let canEnterCurrentBatch = !dependencies.find(name => latestBatch.includes(name));
        if (canEnterCurrentBatch) {
            latestBatch.push(packageName);
        } else {
            batches.push([packageName]);
        }
    }

    console.log();
    console.log(
        `The build process will be performed in ${green(batches.length)} ${
            batches.length > 1 ? "batches" : "batch"
        }.`
    );
    console.log();

    let buildOverrides = {};
    if (argv.buildOverrides) {
        try {
            buildOverrides = JSON.parse(argv.buildOverrides);
            if (argv.debug) {
                console.log(
                    `The following overrides will be passed upon calling the package's ${green(
                        "build"
                    )} command:`
                );

                // Stringify it just for the improved formatting.
                console.log(green(JSON.stringify(buildOverrides, null, 2)));
            }
        } catch (e) {
            console.log("Warning: could not JSON.parse passed build overrides.");
        }
        console.log();
    }

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const batchStart = new Date();
        console.log(
            green(`[${i + 1}/${batches.length}]`) + ` Building ${green(batch.length)} package(s)...`
        );

        const promises = [];
        for (let j = 0; j < batch.length; j++) {
            const currentPackage = workspacesPackages.find(item => item.name === batch[j]);
            console.log(`‣ ${green(currentPackage.packageJson.name)}`);
            promises.push(
                new Promise(async (resolve, reject) => {
                    const configPath = path
                        .join(currentPackage.packageFolder, "webiny.config")
                        .replace(/\\/g, "/");

                    // There are two options:
                    // 1) use webiny.config.js for v5 packages
                    // 2) run build script for v6 packages
                    if (fs.existsSync(configPath + ".js") || fs.existsSync(configPath + ".ts")) {
                        const config = require(configPath);
                        try {
                            await config.commands.build({
                                // We don't want debug nor regular logs logged within the build command.
                                logs: false,
                                debug: false,
                                overrides: buildOverrides
                            });
                        } catch (e) {
                            console.log(e.message);
                            reject({
                                error: e,
                                package: currentPackage
                            });
                        }
                    } else {
                        // Run build script using execa
                        await execa("yarn", ["build"], { cwd: currentPackage.packageFolder });
                    }

                    // Copy and paste built code into the cache folder.
                    // Take packageJson.webiny config into consideration:
                    // - for v5 packages, use the `dist` folder.
                    // - for v6 packages, get destination from packageJson.webiny config object.
                    const cacheFolderPath = path.join(
                        CACHE_FOLDER_PATH,
                        currentPackage.packageJson.name
                    );

                    const buildFolder = getBuildOutputFolder(currentPackage);
                    fs.copySync(buildFolder, cacheFolderPath);

                    // Store package hash
                    const sourceHash = await getPackageSourceHash(currentPackage);
                    metaJson.packages[currentPackage.packageJson.name] = { sourceHash };

                    writeJson.sync(META_FILE_PATH, metaJson);
                    resolve();
                })
            );
        }

        const results = await Promise.allSettled(promises);
        const duration = (new Date() - batchStart) / 1000;
        const rejected = results.filter(item => item.status === "rejected");

        console.log();
        if (rejected.length === 0) {
            console.log(`Batch ${green(i + 1)} completed in ${green(duration + "s")}.`);
            console.log();
            continue;
        }

        console.log(`Batch ${red(i + 1)} failed to complete.`);
        console.log();
        console.log("The following errors occurred while processing the batch:");
        for (let j = 0; j < rejected.length; j++) {
            const { reason } = rejected[j];
            j > 0 && console.log();
            console.log(`‣ ${red(reason.package.packageJson.name)}`);
            console.log(reason.error.message);
        }

        throw new Error(
            `Failed to process batch ${red(i + 1)}. Check the above logs for more information.`
        );
    }
}

// Utility functions.
function getPackageCacheFolderPath(workspacePackage) {
    return path.join(CACHE_FOLDER_PATH, workspacePackage.packageJson.name);
}

async function getPackageSourceHash(workspacePackage) {
    const { hash } = await hashElement(workspacePackage.packageFolder, {
        folders: { exclude: ["dist", "lib"] },
        files: { exclude: ["tsconfig.build.tsbuildinfo"] }
    });

    return hash;
}
