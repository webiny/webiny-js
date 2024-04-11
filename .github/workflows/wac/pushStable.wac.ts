import { createWorkflow } from "github-actions-wac";
import { createJob, createValidateWorkflowsJob } from "./jobs";
import { createRunBuildCacheSteps, createYarnCacheSteps, createInstallBuildSteps } from "./steps";
import { BUILD_PACKAGES_RUNNER } from "./utils";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: "" });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: "" });
const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: "" });

// Note: we don't use global build cache here because we don't know which cache to use.
// Commits from both `dev` and `next` branches can be merged into `stable`, so we need
// to build the packages from scratch. Maybe we can improve this in the future.

export const pushStable = createWorkflow({
    name: "Stable Branch - Push",
    on: {
        push: {
            branches: ["stable"]
        }
    },
    jobs: {
        validateWorkflows: createValidateWorkflowsJob(),
        constants: createJob({
            name: "Create constants",
            outputs: { "run-cache-key": "${{ steps.run-cache-key.outputs.run-cache-key }}" },
            setupNode: false,
            steps: [
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
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [
                ...yarnCacheSteps,
                ...installBuildSteps,

                // Once we've built packages (without the help of the global cache), we can now cache
                // the result for this run workflow. All of the following jobs will use this cache.
                ...runBuildCacheSteps
            ]
        }),
        npmReleaseBeta: createJob({
            needs: ["constants", "build"],
            name: 'NPM release ("beta" tag)',
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                BETA_VERSION: "${{ vars.BETA_VERSION }}"
            },
            checkout: { "fetch-depth": 0 },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                {
                    name: 'Create ".npmrc" file in the project root',
                    run: 'echo "//registry.npmjs.org/:_authToken=\\${NPM_TOKEN}" > .npmrc'
                },
                {
                    name: "Set git email",
                    run: 'git config --global user.email "webiny-bot@webiny.com"'
                },
                {
                    name: "Set git username",
                    run: 'git config --global user.name "webiny-bot"'
                },
                {
                    name: 'Version and publish "beta" tag to NPM',
                    run: "yarn release --type=beta"
                }
            ]
        }),
        npmReleaseLatest: createJob({
            needs: ["constants", "npmReleaseBeta"],
            name: 'NPM release ("latest" tag)',
            environment: "release",
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                LATEST_VERSION: "${{ vars.LATEST_VERSION }}"
            },
            checkout: {
                ref: "${{ github.head_ref }}",
                "fetch-depth": 0
            },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                {
                    name: 'Create ".npmrc" file in the project root',
                    run: 'echo "//registry.npmjs.org/:_authToken=\\${NPM_TOKEN}" > .npmrc'
                },
                {
                    name: "Set git email",
                    run: 'git config --global user.email "webiny-bot@webiny.com"'
                },
                {
                    name: "Set git username",
                    run: 'git config --global user.name "webiny-bot"'
                },
                {
                    name: 'Version and publish "latest" tag to NPM',
                    run: "yarn release --type=latest"
                }
            ]
        })
    }
});
