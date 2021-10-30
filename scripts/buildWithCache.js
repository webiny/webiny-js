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
    // Lists only packages in "packages" folder (check `lerna.json` config).
    const packagesList = await execa("lerna", ["list", "--toposort", "--graph"]).then(
        ({ stdout }) => JSON.parse(stdout)
    );

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

    // Only build and cache of TS packages.
    const workspacesPackages = getPackages({ includes: "/packages/" }).filter(item => item.isTs);

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const promises = [];
        for (let j = 0; j < batch.length; j++) {
            const currentPackage = workspacesPackages.find(item => item.name === batch[j]);
            if (!currentPackage) {
                continue;
            }
            promises.push(
                new Promise(async (resolve, reject) => {
                    console.log("building", currentPackage.name);
                    const configPath = path
                        .join(currentPackage.packageFolder, "webiny.config")
                        .replace(/\\/g, "/");
                    const config = require(configPath);
                    try {
                        await config.commands.build();
                        resolve();
                    } catch (e) {
                        console.log(e)
                        reject("Failed build: " + currentPackage.name)
                    }
                })
            );
        }
        await Promise.all(promises);

    }
}

async function build2() {
    // Only do caching of TS packages.
    const workspacesPackages = getPackages({ includes: "/packages/" }).filter(item => item.isTs);

    let metaJson = { packages: {} };
    try {
        metaJson = loadJson.sync(META_FILE_PATH);
    } catch {}

    const packagesNoCache = [];
    const packagesUseCache = [];

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
            console.log(`To build all packages regardless of cache, use the --no-cache flag.`);
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
    await new Promise(resolve => setTimeout(resolve, 3000));

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

    const isFullBuild = packagesNoCache.length === workspacesPackages.length;
    let error;
    try {
        if (isFullBuild) {
            fullBuild(packagesNoCache);
        } else {
            partialBuild(packagesNoCache);
        }
    } catch (e) {
        // Don't do anything.
        error = e;
    }

    if (error) {
        console.log("Packages partially built, updating cache where possible...");
    } else {
        console.log("Packages built, updating cache...");
    }

    for (let i = 0; i < packagesNoCache.length; i++) {
        const workspacePackage = packagesNoCache[i];
        const success = fs.existsSync(
            path.join(workspacePackage.packageFolder, "dist", "package.json")
        );

        if (success) {
            const cacheFolderPath = path.join(CACHE_FOLDER_PATH, workspacePackage.packageJson.name);
            fs.copySync(path.join(workspacePackage.packageFolder, "dist"), cacheFolderPath);

            const sourceHash = await getPackageSourceHash(workspacePackage);
            metaJson.packages[workspacePackage.packageJson.name] = { sourceHash };
        }
    }

    writeJson.sync(META_FILE_PATH, metaJson);

    if (error) {
        throw error;
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

function fullBuild(workspacePackages) {
    execa.sync(
        "yarn",
        [
            "lerna",
            "run",
            "build",
            "--stream",
            ...workspacePackages.reduce((current, item) => {
                current.push("--scope", item.packageJson.name);
                return current;
            }, [])
        ],
        {
            stdio: "inherit"
        }
    );
}

function partialBuild(workspacePackages) {
    const topologicallySortedPackagesList = JSON.parse(
        execa.sync("yarn", ["lerna", "list", "--toposort", "--json"]).stdout
    );

    for (let i = 0; i < topologicallySortedPackagesList.length; i++) {
        const pckg = topologicallySortedPackagesList[i];
        if (workspacePackages.find(item => item.packageJson.name === pckg.name)) {
            console.log(`Building ${green(pckg.name)}...`);
            execa.sync("yarn", ["build"], {
                stdio: "inherit",
                cwd: pckg.location
            });
        }
    }
}
