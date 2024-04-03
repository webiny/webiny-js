import { createWorkflow, NormalJob } from "github-actions-wac";
import { createValidateWorkflowsJob, createJob } from "./jobs";
import { NODE_VERSION, listPackagesWithJestTests } from "./utils";

const yarnCacheSteps: NormalJob["steps"] = [
    {
        uses: "actions/cache@v4",
        with: {
            path: ".yarn/cache",
            key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
        }
    }
];

const buildGlobalCacheSteps = [
    {
        uses: "actions/cache@v4",
        with: {
            path: ".webiny/cached-packages",
            key: "${{ needs.constants.outputs.global-cache-key }}"
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

const createJestTestsJob = (storage: string | null) => {
    const env: Record<string, string> = {};

    if (storage) {
        if (storage === "ddb-es") {
            env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_ELASTIC_SEARCH_DOMAIN_NAME }}";
            env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.ELASTIC_SEARCH_ENDPOINT }}";
            env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ matrix.package.id }}";
        } else if (storage === "ddb-os") {
            // We still use the same environment variables as for "ddb-es" setup, it's
            // just that the values are read from different secrets.
            env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_OPEN_SEARCH_DOMAIN_NAME }}";
            env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.OPEN_SEARCH_ENDPOINT }}";
            env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ matrix.package.id }}";
        }
    }

    const packages = listPackagesWithJestTests({
        storage
    });

    const job: NormalJob = createJob({
        needs: ["constants", "build"],
        name: "${{ matrix.package.cmd }}",
        strategy: {
            "fail-fast": false,
            matrix: {
                os: ["ubuntu-latest"],
                node: [NODE_VERSION],
                package: "${{ fromJson('" + JSON.stringify(packages) + "') }}"
            }
        },
        "runs-on": "${{ matrix.os }}",
        env,
        awsAuth: storage === "ddb-es" || storage === "ddb-os",
        steps: [
            ...yarnCacheSteps,
            ...buildRunCacheSteps,
            {
                name: "Install dependencies",
                run: "yarn --immutable"
            },
            {
                name: "Build packages",
                run: "yarn build:quick"
            },
            {
                name: "Run tests",
                run: "yarn test ${{ matrix.package.cmd }}"
            }
        ]
    });

    // We prevent running of Jest tests if a PR was created from a fork.
    // This is because we don't want to expose our AWS credentials to forks.
    if (storage === "ddb-es" || storage === "ddb-os") {
        job.if = "needs.constants.outputs.is-fork-pr != 'true'";
    }

    return job;
};

export const pullRequests = createWorkflow({
    name: "Pull Requests",
    on: "pull_request",
    jobs: {
        validateWorkflows: createValidateWorkflowsJob(),
        validateCommits: createJob({
            name: "Validate commit messages",
            if: "github.base_ref != 'dev'",
            steps: [{ uses: "webiny/action-conventional-commits@v1.3.0" }]
        }),
        // Don't allow "feat" commits to be merged into "dev" branch.
        validateCommitsDev: createJob({
            name: "Validate commit messages (dev branch, 'feat' commits not allowed)",
            if: "github.base_ref == 'dev'",
            steps: [
                {
                    uses: "webiny/action-conventional-commits@v1.3.0",
                    with: {
                        // If dev, use "dev" commit types, otherwise use "next" commit types.
                        "allowed-commit-types":
                            "fix,docs,style,refactor,test,build,perf,ci,chore,revert,merge,wip"
                    }
                }
            ]
        }),
        constants: {
            name: "Create constants",
            "runs-on": "ubuntu-latest",
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}",
                "run-cache-key": "${{ steps.run-cache-key.outputs.run-cache-key }}",
                "is-fork-pr": "${{ steps.is-fork-pr.outputs.is-fork-pr }}"
            },
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: 'echo "global-cache-key=${{ github.base_ref }}-${{ runner.os }}-$(/bin/date -u "+%m%d")-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT'
                },
                {
                    name: "Create workflow run cache key",
                    id: "run-cache-key",
                    run: 'echo "run-cache-key=${{ github.run_id }}-${{ github.run_attempt }}-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT'
                },
                {
                    name: "Is a PR from a fork",
                    id: "is-fork-pr",
                    run: 'echo "is-fork-pr=${{ github.event.pull_request.head.repo.fork }}" >> $GITHUB_OUTPUT'
                }
            ]
        },
        build: createJob({
            name: "Build",
            needs: "constants",
            "runs-on": "webiny-build-packages",
            steps: [
                ...yarnCacheSteps,
                ...buildGlobalCacheSteps,
                {
                    name: "Install dependencies",
                    run: "yarn --immutable"
                },
                {
                    name: "Build packages",
                    run: "yarn build:quick"
                },
                // Once we've built packages with the help of the global cache, we can now cache
                // the result for this run. All of the following jobs will use this cache.
                ...buildRunCacheSteps
            ]
        }),
        staticCodeAnalysis: createJob({
            needs: ["constants", "build"],
            name: "Static code analysis",
            steps: [
                ...yarnCacheSteps,
                ...buildRunCacheSteps,
                {
                    name: "Install dependencies",
                    run: "yarn --immutable"
                },
                {
                    name: "Check code formatting",
                    run: "yarn prettier:check"
                },
                {
                    name: "Check dependencies",
                    run: "yarn adio"
                },
                {
                    name: "Check TS configs",
                    run: "yarn check-ts-configs"
                },
                {
                    name: "ESLint",
                    run: "yarn eslint"
                }
            ]
        }),
        staticCodeAnalysisTs: createJob({
            name: "Static code analysis (TypeScript)",
            "runs-on": "webiny-build-packages",
            steps: [
                ...yarnCacheSteps,

                // We're not using run cache here. We want to build all packages
                // with TypeScript, to ensure there are no TypeScript errors.
                // ...buildRunCacheSteps,

                {
                    name: "Install dependencies",
                    run: "yarn --immutable"
                },
                {
                    name: "Build packages (full)",
                    run: "yarn build"
                },
                {
                    name: "Check types for Cypress tests",
                    run: "yarn cy:ts"
                }
            ]
        }),
        jestTestsNoStorage: createJestTestsJob(null),
        jestTestsDdb: createJestTestsJob("ddb"),
        jestTestsDdbEs: createJestTestsJob("ddb-es"),
        jestTestsDdbOs: createJestTestsJob("ddb-os"),

        verdaccioPublish: createJob({
            name: "Publish to Verdaccio",
            needs: ["constants", "build"],
            if: "needs.constants.outputs.is-fork-pr != 'true'",
            checkout: {
                "fetch-depth": 0,
                ref: "${{ github.event.pull_request.head.ref }}"
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
                    run: "yarn build:quick"
                },
                {
                    name: "Start Verdaccio local server",
                    run: "npx pm2 start verdaccio -- -c .verdaccio.yaml"
                },
                {
                    name: "Configure NPM to use local registry",
                    run: "npm config set registry http://localhost:4873"
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
                    name: 'Create ".npmrc" file in the project root, with a dummy auth token',
                    run: "echo '//localhost:4873/:_authToken=\"dummy-auth-token\"' > .npmrc"
                },
                {
                    name: "Version and publish to Verdaccio",
                    run: "yarn release --type=verdaccio"
                },
                {
                    name: "Upload verdaccio files",
                    uses: "actions/upload-artifact@v4",
                    with: {
                        name: "verdaccio-files",
                        "retention-days": 1,
                        path: ".verdaccio/\n.verdaccio.yaml\n"
                    }
                }
            ]
        }),
        testCreateWebinyProject: createJob({
            name: 'Test "create-webiny-project"',
            needs: "verdaccioPublish",
            strategy: {
                "fail-fast": false,
                matrix: {
                    os: ["ubuntu-latest"],
                    node: [NODE_VERSION]
                }
            },
            "runs-on": "${{ matrix.os }}",
            checkout: false,
            setupNode: {
                "node-version": "${{ matrix.node }}"
            },
            steps: [
                {
                    uses: "actions/download-artifact@v4",
                    with: {
                        name: "verdaccio-files",
                        path: "verdaccio-files"
                    }
                },
                {
                    name: "Start Verdaccio local server",
                    "working-directory": "verdaccio-files",
                    run: "yarn add pm2 verdaccio && npx pm2 start verdaccio -- -c .verdaccio.yaml"
                },
                {
                    name: "Configure NPM to use local registry",
                    run: "npm config set registry http://localhost:4873"
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
                    name: "Disable Webiny telemetry",
                    run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
                },
                {
                    name: "Create a new Webiny project",
                    run: 'npx create-webiny-project@local-npm test-project --tag local-npm --no-interactive --assign-to-yarnrc \'{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}\' --template-options \'{"region":"eu-central-1"}\'\n'
                }
            ]
        })
    }
});
