import { ACTION } from "../utils/index.js";
interface CreateGlobalBuildCacheStepsParams {
    workingDirectory: string;

    // Restore the cache without attempting to save it afterwards. Same reason as in
    // `createYarnCacheSteps`: `issue_comment`-triggered workflows get a read-only cache token, and
    // this cache is populated by the scheduled "Rebuild global cache" workflow anyway.
    restoreOnly?: boolean;
}

export const createGlobalBuildCacheSteps = (params: CreateGlobalBuildCacheStepsParams) => {
    return [
        {
            uses: params.restoreOnly ? ACTION.cacheRestore : ACTION.cache,
            with: {
                path: [params.workingDirectory, ".webiny/cached-packages"]
                    .filter(Boolean)
                    .join("/"),
                key: "${{ needs.constants.outputs.global-cache-key }}"
            }
        }
    ] as const;
};
