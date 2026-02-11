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

const BRANCH_NAME = "${{ github.event.inputs.branch }}";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: BRANCH_NAME });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: BRANCH_NAME });
const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: BRANCH_NAME });
const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: BRANCH_NAME });

export const unstableRelease = createWorkflow({
    name: `📦 Unstable Release`,
    on: {
        workflow_dispatch: {
            inputs: {
                branch: {
                    description: "Branch to release from",
                    required: true,
                    default: "next",
                    type: "string"
                }
            }
        }
    },
    jobs: {
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
                    run: `echo "global-cache-key=${BRANCH_NAME}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
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
            checkout: { path: BRANCH_NAME, ref: BRANCH_NAME },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [
                ...yarnCacheSteps,
                ...globalBuildCacheSteps,
                ...installBuildSteps,
                ...runBuildCacheSteps
            ]
        }),
        npmReleaseUnstable: createJob({
            needs: ["constants", "build"],
            name: 'NPM release ("unstable" tag)',
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                UNSTABLE_VERSION: "${{ vars.UNSTABLE_VERSION }}"
            },
            checkout: { path: BRANCH_NAME, ref: BRANCH_NAME, "fetch-depth": 0 },
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
                            name: "Set git email",
                            run: 'git config --global user.email "webiny-bot@webiny.com"'
                        },
                        {
                            name: "Set git username",
                            run: 'git config --global user.name "webiny-bot"'
                        },
                        {
                            name: 'Version and publish "unstable" tag to NPM',
                            "working-directory": BRANCH_NAME,
                            run: "yarn release --type=unstable"
                        }
                    ],
                    { "working-directory": BRANCH_NAME }
                )
            ]
        })
    }
});
