import { createWorkflow, NormalJob } from "github-actions-wac";
import { createJob, createValidateWorkflowsJob } from "./jobs";

const yarnCacheSteps: NormalJob["steps"] = [
    {
        uses: "actions/cache@v4",
        with: {
            path: ".yarn/cache",
            key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
        }
    }
];

const buildRunCacheSteps = [
    {
        uses: "actions/cache@v4",
        with: {
            path: ".webiny/cached-packages",
            key: "${{ needs.constants.outputs.run-cache-key }}"
        }
    }
];

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
        constants: {
            name: "Create constants",
            "runs-on": "ubuntu-latest",
            outputs: {
                "run-cache-key": "${{ steps.run-cache-key.outputs.run-cache-key }}"
            },
            steps: [
                {
                    name: "Create workflow run cache key",
                    id: "run-cache-key",
                    run: 'echo "run-cache-key=-${{ github.run_id }}-${{ github.run_attempt }}-${{ secrets.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT'
                }
            ]
        },
        build: createJob({
            name: "Build",
            needs: "constants",
            "runs-on": "webiny-build-packages",
            steps: [
                ...yarnCacheSteps,
                {
                    name: "Install dependencies",
                    run: "yarn --immutable"
                },
                {
                    name: "Build packages",
                    run: "yarn build:quick"
                },

                // Once we've built packages (without the help of the global cache), we can now cache
                // the result for this run workflow. All of the following jobs will use this cache.
                ...buildRunCacheSteps
            ]
        }),
        npmReleaseBeta: createJob({
            needs: ["constants"],
            name: 'NPM release ("beta" tag)',
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                BETA_VERSION: "${{ vars.BETA_VERSION }}"
            },
            checkout: {
                with: { "fetch-depth": 0 }
            },
            steps: [
                ...yarnCacheSteps,
                ...buildRunCacheSteps,
                {
                    name: "Install dependencies",
                    run: "yarn --immutable"
                },
                {
                    name: "Build packages",
                    run: "yarn build"
                },
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
            needs: ["constants", "npm-release-beta"],
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
                ...buildRunCacheSteps,
                {
                    name: "Install dependencies",
                    run: "yarn --immutable"
                },
                {
                    name: "Build packages",
                    run: "yarn build"
                },
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
