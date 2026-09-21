import { ACTION } from "../utils/index.js";
interface CreateYarnCacheStepsParams {
    workingDirectory: string;

    // Restore the cache without attempting to save it afterwards. Set this for workflows triggered
    // by `issue_comment` (our /alpha, /beta, /e2e and /vitest commands): since GitHub's June 2026
    // "read-only cache for low-trust triggers" change, those runs get a read-only cache token and
    // every save fails with "cache write denied: token has no writable scopes" - a warning on an
    // otherwise green job. Restores still work, and the cache is kept fresh by the `push` and
    // `pull_request` workflows, so there is nothing to gain from trying. See also
    // `createRunBuildArtifactSteps`, which sidesteps the same restriction using artifacts.
    restoreOnly?: boolean;
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
//
// `restore-keys` makes a changed `yarn.lock` a delta fetch instead of a full one. The exact `key`
// misses whenever a PR bumps the lockfile, and without a fallback the cache folder starts out empty
// and Yarn re-downloads every dependency. The prefix restores the most recent Yarn cache we have,
// so Yarn only fetches what the bump actually added. This is safe because the global cache is
// content-addressed per package version: entries from another lockfile are an imperfect SET of
// zips, never a wrong zip - Yarn uses what matches the current lock and fetches the rest.
//
// The cost is that saving workflows carry stale entries forward into the new key, so the cache
// grows slowly. Bump the literal `yarn-` prefix below (to `yarn2-`) to start clean if it ever gets
// out of hand - that changes both the key and the fallback prefix, orphaning every old entry.
export const createYarnCacheSteps = (params: CreateYarnCacheStepsParams) => {
    return [
        {
            name: "Resolve Yarn cache folder",
            id: "yarn-cache-folder",
            "working-directory": params.workingDirectory,
            run: 'echo "path=$(yarn config get cacheFolder)" >> $GITHUB_OUTPUT'
        },
        {
            uses: params.restoreOnly ? ACTION.cacheRestore : ACTION.cache,
            with: {
                path: "${{ steps.yarn-cache-folder.outputs.path }}",
                key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}",
                "restore-keys": "yarn-${{ runner.os }}-"
            }
        }
    ] as const;
};
