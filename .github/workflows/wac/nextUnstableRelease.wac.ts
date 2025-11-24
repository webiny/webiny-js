import { createWorkflow } from "github-actions-wac";
import { BUILD_PACKAGES_RUNNER } from "./utils";
import { createJob } from "./jobs";
import {
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createRunBuildCacheSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps";

const DIR_WEBINY_JS = "next";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });

export const nextUnstableRelease = createWorkflow({
    name: `Next Branch - Unstable Release`,
    on: {
        workflow_run: {
            workflows: ["Next Branch - Push"],
            branches: ["next"],
            types: ["completed"]
        }
    },
    jobs: {
        // validateWorkflows: createValidateWorkflowsJob(),
        constants: createJob({
            name: "Create constants",
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}",
                "run-cache-key": "${{ steps.run-cache-key.outputs.run-cache-key }}"
            },
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: `echo "global-cache-key=${DIR_WEBINY_JS}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
                },
                {
                    name: "Create workflow run cache key",
                    id: "run-cache-key",
                    run: 'echo "run-cache-key=${{ github.run_id }}-${{ github.run_attempt }}-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        build: createJob({
            name: "Build",
            needs: "constants",
            checkout: { path: DIR_WEBINY_JS },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [
                ...yarnCacheSteps,
                ...globalBuildCacheSteps,
                ...installBuildSteps,
                ...runBuildCacheSteps
            ]
        }),
        npmUnstableRelease: createJob({
            needs: ["constants", "build"],
            name: 'NPM release ("unstable" tag)',
            environment: "release",
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}"
            },
            checkout: { "fetch-depth": 0 },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                ...withCommonParams(
                    [
                        {
                            name: 'Create ".npmrc" file in the project root',
                            run: 'echo "//registry.npmjs.org/:_authToken=\\${NPM_TOKEN}" > .npmrc'
                        },
                        {
                            name: "Set git info",
                            run: 'git config --global user.email "webiny-bot@webiny.com"\ngit config --global user.name "webiny-bot"\n'
                        },
                        { name: "Version and publish to NPM", run: "yarn release --type=unstable" }
                    ],
                    { "working-directory": DIR_WEBINY_JS }
                )
            ]
        })
    }
});
