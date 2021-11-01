#!/usr/bin/env node
const { getPackages } = require("./utils/getPackages");
const { hashElement } = require("folder-hash");
const fs = require("fs-extra");
const execa = require("execa");
const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const { green, red } = require("chalk");
const argv = require("yargs").argv;

const CACHE_FOLDER_PATH = ".webiny/cached-packages";
const META_FILE_PATH = path.join(CACHE_FOLDER_PATH, "meta.json");

(async () => {
    try {
        const start = new Date();
        await build();

        await require("./linkWorkspaces");

        const duration = (new Date() - start) / 1000;
        console.log(`Done! Finished in ${green(duration + "s")}.`);
    } catch (e) {
        console.log(red("An error occurred while executing the command:"));
        console.log(e);
        process.exit(1);
    }
})();

async function build() {
    let metaJson = { packages: {} };
    try {
        metaJson = loadJson.sync(META_FILE_PATH);
    } catch {}

    const packagesNoCache = [];
    const packagesUseCache = [];

    const workspacesPackages = getPackages({ includes: "/packages/" }).filter(item => item.isTs);

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
            fs.copySync(cacheFolderPath, path.join(workspacePackage.packageFolder, "dist"));
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

    // Wait three seconds, just in case the dev changes his/her mind. :)
    // await new Promise(resolve => setTimeout(resolve, 3000));

    if (packagesNoCache.length > 10) {
        console.log(`Running build for ${green(packagesNoCache.length)} packages.`);
    } else {
        console.log("Running build for the following packages:");
        for (let i = 0; i < packagesNoCache.length; i++) {
            const item = packagesNoCache[i];
            console.log(`- ${green(item.packageJson.name)}`);
        }
        console.log();
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
    console.log(`Starting build...`);
    if (batches.length > 1) {
        console.log(`The build process will be performed in ${green(batches.length)} batches.`);
    }

    console.log();

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const batchStart = new Date();
        console.log(
            green(`[${i + 1}/${batches.length}]` + ` ${green(batch.length)} package(s) to build...`)
        );
        const promises = [];
        for (let j = 0; j < batch.length; j++) {
            const currentPackage = workspacesPackages.find(item => item.name === batch[j]);
            promises.push(
                new Promise(async (resolve, reject) => {
                    const configPath = path
                        .join(currentPackage.packageFolder, "webiny.config")
                        .replace(/\\/g, "/");
                    const config = require(configPath);
                    try {
                        await config.commands.build();

                        // Copy and paste built code into the cache folder.
                        const cacheFolderPath = path.join(
                            CACHE_FOLDER_PATH,
                            currentPackage.packageJson.name
                        );
                        fs.copySync(
                            path.join(currentPackage.packageFolder, "dist"),
                            cacheFolderPath
                        );

                        const sourceHash = await getPackageSourceHash(currentPackage);
                        metaJson.packages[currentPackage.packageJson.name] = { sourceHash };

                        writeJson.sync(META_FILE_PATH, metaJson);

                        resolve();
                    } catch (e) {
                        console.log(e);
                        reject("Failed build: " + currentPackage.name);
                    }
                })
            );
        }
        await Promise.all(promises);

        const duration = (new Date() - batchStart) / 1000;
        console.log(`Batch completed in ${green(duration + "s")}.`);
        console.log("");
    }
}

// Utility functions.
function getPackageCacheFolderPath(workspacePackage) {
    return path.join(CACHE_FOLDER_PATH, workspacePackage.packageJson.name);
}

async function getPackageSourceHash(workspacePackage) {
    const { hash } = await hashElement(workspacePackage.packageFolder, {
        folders: { exclude: ["dist"] },
        files: { exclude: ["tsconfig.build.tsbuildinfo"] }
    });

    return hash;
}
