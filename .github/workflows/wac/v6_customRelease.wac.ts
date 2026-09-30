import { createWorkflow } from "github-actions-wac";
import { BUILD_PACKAGES_RUNNER } from "./utils";
import { createJob, createSlackFailureJob } from "./jobs";
import {
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createRunBuildCacheSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps";

// Triggered via `yarn trigger-release` (a `release-v6` repository_dispatch event). The payload
// is passed to `yarn release` as-is, so every option (type, tag, version...) is set by the caller.
const BRANCH_NAME = "${{ github.event.client_payload.branch }}";
const DIST_TAG = "${{ github.event.client_payload.tag }}";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: BRANCH_NAME });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: BRANCH_NAME });
const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: BRANCH_NAME });
const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: BRANCH_NAME });

export const v6_customRelease = createWorkflow({
    name: `📦 v6 Custom Release`,
    on: {
        repository_dispatch: {
            types: ["release-v6"]
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
        npmRelease: createJob({
            needs: ["constants", "build"],
            name: `NPM release ("${DIST_TAG}" tag)`,
            environment: "release",
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                // Passed through env (not interpolated into `run`) so payload values can't inject shell code.
                RELEASE_TYPE: "${{ github.event.client_payload.type }}",
                RELEASE_TAG: DIST_TAG,
                RELEASE_VERSION: "${{ github.event.client_payload.version }}",
                RELEASE_CREATE_GITHUB_RELEASE:
                    "${{ github.event.client_payload.createGithubRelease }}"
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
                            name: "Version and publish to NPM",
                            run: [
                                "yarn release",
                                '--type="$RELEASE_TYPE"',
                                '--tag="$RELEASE_TAG"',
                                '--version="$RELEASE_VERSION"',
                                '--createGithubRelease="$RELEASE_CREATE_GITHUB_RELEASE"'
                            ].join(" ")
                        }
                    ],
                    { "working-directory": BRANCH_NAME }
                )
            ]
        }),
        notifySlackOnFailure: createSlackFailureJob({
            needs: ["constants", "build", "npmRelease"],
            label: "📦 v6 Custom Release"
        })
    }
});
