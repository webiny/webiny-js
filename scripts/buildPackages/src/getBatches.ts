import fs from "fs-extra";
import execa from "execa";
import path from "path";
import { green } from "chalk";
import { getPackages } from "../../utils/getPackages";
import { Package } from "./types";
import { CACHE_FOLDER_PATH } from "./constants";
import { getBuildOutputFolder } from "./getBuildOutputFolder";
import { getPackageSourceHash } from "./getPackageSourceHash";
import { getBuildMeta } from "./getBuildMeta";
import { getPackageCacheFolderPath } from "./getPackageCacheFolderPath";

interface GetBatchesOptions {
    cache?: boolean;
    packagesWhitelist?: string[];
}

export async function getBatches(options: GetBatchesOptions = {}) {
    const metaJson = getBuildMeta();

    const packagesNoCache: Package[] = [];
    const packagesUseCache: Package[] = [];

    let workspacesPackages = (
        getPackages({
            includes: ["/packages/"]
        }) as Package[]
    )
        .filter(pkg => pkg.isTs)
        .filter(pkg => {
            // Check if packages has a build script
            return pkg.packageJson.scripts && "build" in pkg.packageJson.scripts;
        });

    const packagesWhitelist = options.packagesWhitelist;
    if (Array.isArray(packagesWhitelist) && packagesWhitelist.length) {
        workspacesPackages = workspacesPackages.filter(pkg => {
            return packagesWhitelist.includes(pkg.name);
        });
    }

    console.log(`There is a total of ${green(workspacesPackages.length)} packages.`);

    const useCache = options.cache ?? false;

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
        return { batches: [], packagesNoCache, allPackages: workspacesPackages };
    }

    // Building all packages - we're respecting the dependency graph.
    // Note: lists only packages in "packages" folder (check `lerna.json` config).
    const rawPackagesList: Record<string, string[]> = await execa("lerna", [
        "list",
        "--toposort",
        "--graph",
        "--all",
        // We must ignore `project-utils`, because it's a dev dependency for all our packages.
        "--ignore=@webiny/project-utils"
    ]).then(({ stdout }) => JSON.parse(stdout));

    const packagesList: Record<string, string[]> = {};

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

    const batches: string[][] = [[]];
    for (const packageName in packagesList) {
        const dependencies = packagesList[packageName];
        const latestBatch = batches[batches.length - 1];
        const canEnterCurrentBatch = !dependencies.find(name => latestBatch.includes(name));
        if (canEnterCurrentBatch) {
            latestBatch.push(packageName);
        } else {
            batches.push([packageName]);
        }
    }

    return {
        batches,
        packagesNoCache,
        allPackages: workspacesPackages
    };
}
