import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { getPackages } from "../../utils/getPackages";
import { WorkspaceGraph } from "../../utils/WorkspaceGraph.js";
import { Package } from "./types";
import { CACHE_FOLDER_PATH } from "./constants";
import { getBuildOutputFolder } from "./getBuildOutputFolder";
import { getBuildMeta } from "./getBuildMeta";
import { getPackageCacheFolderPath } from "./getPackageCacheFolderPath";
import { distMatchesCache, recordCacheHash } from "./distContentHash";
import { getEffectiveHashes } from "./getEffectiveHashes";

const { green } = chalk;

interface GetBatchesOptions {
    cache?: boolean;
    packagesWhitelist?: string[];
}

export async function getBatches(options: GetBatchesOptions = {}) {
    const metaJson = getBuildMeta();

    const packagesNoCache: Package[] = [];
    const packagesUseCache: Package[] = [];

    const allWorkspacePackages = getPackages({
        includes: ["/packages/"]
    }) as Package[];

    let workspacesPackages = allWorkspacePackages.filter(pkg => pkg.mustBuild);

    const packagesWhitelist = options.packagesWhitelist;
    if (Array.isArray(packagesWhitelist) && packagesWhitelist.length) {
        workspacesPackages = workspacesPackages.filter(pkg => {
            return packagesWhitelist.includes(pkg.name);
        });
    }

    console.log(`There is a total of ${green(workspacesPackages.length)} packages.`);

    const useCache = options.cache ?? false;

    const workspaceGraph = new WorkspaceGraph({
        ignore: ["@webiny/project-utils"]
    });

    // Dependency-aware build key per package: changes when the package's own
    // source OR any (transitive) workspace dependency changes. Computed over the
    // full workspace so dependents of a changed package are detected as misses.
    const effectiveKeys = await getEffectiveHashes(allWorkspacePackages);

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

            const key = effectiveKeys.get(workspacePackage.name) ?? "";

            const packageMeta = metaJson.packages[workspacePackage.packageJson.name] || {};

            if (packageMeta.sourceHash === key) {
                packagesUseCache.push(workspacePackage);
            } else {
                packagesNoCache.push(workspacePackage);
            }
        }
    }

    // Dependents of a changed package no longer need explicit tainting: the
    // effective key folds in dependency keys, so any dependent of a changed
    // package is already a cache miss above.

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

        // Skip the cache→dist copy for packages whose dist already matches the
        // cache byte-for-byte (content hash). Reads actual bytes in parallel, so
        // it can't go stale from out-of-band dist writes (`webiny watch`, manual
        // edits) — those change the hash and force a copy.
        const fresh = await Promise.all(packagesUseCache.map(pkg => distMatchesCache(pkg)));

        const restored: Package[] = [];
        for (let i = 0; i < packagesUseCache.length; i++) {
            const workspacePackage = packagesUseCache[i];

            if (fresh[i]) {
                continue;
            }

            const cacheFolderPath = path.join(CACHE_FOLDER_PATH, workspacePackage.packageJson.name);
            fs.copySync(cacheFolderPath, getBuildOutputFolder(workspacePackage));
            restored.push(workspacePackage);
        }

        if (restored.length) {
            // dist now equals the cache — record the hash so the next build can
            // verify freshness by hashing dist alone.
            await Promise.all(restored.map(pkg => recordCacheHash(pkg)));
            console.log(`Restored ${green(restored.length)} package(s) from cache into dist.`);
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
        return { batches: [], packagesNoCache, allPackages: workspacesPackages, effectiveKeys };
    }

    const rawPackagesList = workspaceGraph.toposort();

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
        allPackages: workspacesPackages,
        effectiveKeys
    };
}
