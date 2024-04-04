import { createJob } from "./jobs";
import {
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createYarnCacheSteps
} from "./steps";

const createRebuildGlobalCacheWorkflow = (branchName: string) => ({
    name: `Rebuild Global Cache ("${branchName}" branch)`,
    on: {
        workflow_dispatch: {},
        schedule: [{ cron: "0 4 * * *" }]
    },
    jobs: {
        constants: createJob({
            name: "Create constants",
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}"
            },
            checkout: false,
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: `echo "global-cache-key=${branchName}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
                }
            ]
        }),
        cacheDependenciesPackages: createJob({
            name: `Cache dependencies and packages`,
            needs: "constants",
            checkout: { path: branchName, ref: branchName },
            steps: [
                ...createYarnCacheSteps({ workingDirectory: branchName }),
                ...createGlobalBuildCacheSteps({ workingDirectory: branchName }),
                ...createInstallBuildSteps({ workingDirectory: branchName })
            ]
        })
    }
});

export const rebuildGlobalCacheDev = createRebuildGlobalCacheWorkflow("dev");
export const rebuildGlobalCacheNext = createRebuildGlobalCacheWorkflow("next");
