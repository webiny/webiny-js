interface CreateYarnCacheStepsParams {
    workingDirectory: string;
}

// Caches Yarn's download cache between runs.
//
// The folder is resolved at runtime rather than hardcoded, because where Yarn keeps its cache
// depends on configuration. `.yarnrc.yml` sets `enableGlobalCache: true`, so the cache lives in
// the global folder (`~/.yarn/berry/cache`) and NOT in the project's `.yarn/cache`. This used to
// point at `<workingDirectory>/.yarn/cache`, which stopped existing when `enableGlobalCache` was
// added in #5336 (2026-06-29) - from then on every job missed the cache on restore and warned
// "Path Validation Error: Path(s) specified in the action for caching do(es) not exist" on save,
// so `yarn --immutable` re-downloaded every dependency on every run.
//
// Asking Yarn where its cache is keeps this correct if that setting is ever flipped back.
export const createYarnCacheSteps = (params: CreateYarnCacheStepsParams) => {
    return [
        {
            name: "Resolve Yarn cache folder",
            id: "yarn-cache-folder",
            "working-directory": params.workingDirectory,
            run: 'echo "path=$(yarn config get cacheFolder)" >> $GITHUB_OUTPUT'
        },
        {
            uses: "actions/cache@v5",
            with: {
                path: "${{ steps.yarn-cache-folder.outputs.path }}",
                key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
            }
        }
    ] as const;
};
