import { getBatches } from "./getBatches";
import { getPackagesWhitelist } from "./getPackagesWhitelist";
import type { BuildReporter } from "./reporter";

export interface PreviewBuildOptions {
    p?: string | string[];
    cache?: boolean;
}

/**
 * Answers "what would a build do right now?" without building or writing anything:
 * how many packages are already built, and how many need to be (re)built.
 *
 * Cheap enough to poll every few seconds — it computes the same dependency-aware build
 * keys a real build uses, but skips the cache→dist restore and the dist hashing that
 * decides whether a restore is needed. A package counted as already built may therefore
 * still need its `dist` repopulated from the cache, which is a copy, not a build.
 */
export const previewBuild = async (options: PreviewBuildOptions, reporter: BuildReporter) => {
    const start = Date.now();

    const { batches, packagesNoCache, packagesUseCache, cacheEnabled, allPackages } =
        await getBatches({
            cache: options.cache ?? true,
            packagesWhitelist: getPackagesWhitelist(options.p),
            skipCacheRestore: true
        });

    reporter.preview({
        totalPackages: allPackages.length,
        cacheEnabled,
        upToDate: packagesUseCache.length,
        packagesToBuild: packagesNoCache.length,
        packages: packagesNoCache.map(pkg => pkg.packageJson.name),
        batches: batches.length,
        duration: (Date.now() - start) / 1000
    });
};
