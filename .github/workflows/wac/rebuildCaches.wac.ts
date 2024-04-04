import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs";
import {
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createYarnCacheSteps
} from "./steps";

const createCacheJob = (branchName: string) => {
    return createJob({
        name: `Cache dependencies and packages ("${branchName}" branch)`,
        needs: "constants",
        checkout: { path: branchName },
        steps: [
            ...createYarnCacheSteps({ workingDirectory: branchName }),
            ...createGlobalBuildCacheSteps({ workingDirectory: branchName }),
            ...createInstallBuildSteps({ workingDirectory: branchName }),
            ...createInstallBuildSteps({ workingDirectory: branchName })
        ]
    })
}

export const rebuildCaches = createWorkflow({
    name: "Rebuild Caches",
    on: {
        workflow_dispatch: {},
        schedule: [{ cron: "0 4 * * *" }]
    },
    jobs: {
        constants: createJob({
            name: "Create constants",
            outputs: {
                "global-cache-key-suffix":
                    "${{ steps.global-cache-key.outputs.global-cache-key-suffix }}"
            },
            checkout: false,
            steps: [
                {
                    name: "Create global cache key suffix",
                    id: "global-cache-key",
                    run: 'echo "global-cache-key-suffix=-${{ runner.os }}-$(/bin/date -u "+%m%d")-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        "cache-dependencies-packages-dev": createCacheJob("dev"),
        "cache-dependencies-packages-next": createCacheJob("next"),
    }
});
