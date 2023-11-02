import { createWorkflow, NormalJob } from "github-actions-wac";
import { createSetupVerdaccioSteps } from "./steps";
import { NODE_OPTIONS, NODE_VERSION } from "./utils";
import { listPackagesWithJestTests } from "./utils";

// Let's assign some of the common steps into a standalone const.
const createSetupSteps = ({ workingDirectory = "" } = {}) =>
    [
        {
            uses: "actions/setup-node@v3",
            with: {
                "node-version": NODE_VERSION
            }
        },
        { uses: "actions/checkout@v3", with: { path: workingDirectory } }
    ] as NonNullable<NormalJob["steps"]>;

// Create "Pull requests" workflow.

const createJestTestsJobs = (storage: string | null) => {
    const packages = listPackagesWithJestTests({
        storage
    });

    let jobs: Record<string, any> = {};

    packages.forEach(pkg => {
        const env: Record<string, string> = {};

        if (storage) {
            env["AWS_ACCESS_KEY_ID"] = "${{ secrets.AWS_ACCESS_KEY_ID }}";
            env["AWS_SECRET_ACCESS_KEY"] = "${{ secrets.AWS_SECRET_ACCESS_KEY }}";

            if (storage === "ddb-es") {
                env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] =
                    "${{ secrets.AWS_ELASTIC_SEARCH_DOMAIN_NAME }}";
                env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.ELASTIC_SEARCH_ENDPOINT }}";
                env["ELASTIC_SEARCH_INDEX_PREFIX"] = pkg.id;
            } else if (storage === "ddb-os") {
                // We still use the same environment variables as for "ddb-es" setup, it's
                // just that the values are read from different secrets.
                env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] =
                    "${{ secrets.AWS_OPEN_SEARCH_DOMAIN_NAME }}";
                env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.OPEN_SEARCH_ENDPOINT }}";
                env["ELASTIC_SEARCH_INDEX_PREFIX"] = pkg.id;
            }
        }

        jobs[`jest-${pkg.id}`] = {
            needs: "init",
            name: pkg.cmd,
            "runs-on": "ubuntu-latest",
            env,
            steps: [
                ...createSetupSteps(),
                {
                    uses: "actions/cache@v3",
                    with: {
                        path: ".yarn/cache",
                        key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
                    }
                },
                {
                    uses: "actions/cache@v3",
                    with: {
                        path: ".webiny/cached-packages",
                        key: "packages-cache-${{ needs.init.outputs.ts }}"
                    }
                },
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
        };
    });

    return jobs;
};

export const pullRequestsTest = createWorkflow({
    name: "Pull Requests",
    on: {
        pull_request: {
            branches: ["next-ci-workflows"]
        }
    },

    env: {
        NODE_OPTIONS
    },
    jobs: {
        "validate-workflows": {
            name: "Validate workflows",
            "runs-on": "ubuntu-latest",
            steps: [
                {
                    name: "Validate",
                    run: "npx github-actions-wac validate"
                }
            ]
        },
        "validate-commits": {
            name: "Validate commit messages",
            "runs-on": "ubuntu-latest",
            steps: [
                {
                    uses: "actions/checkout@v3"
                },
                {
                    uses: "webiny/action-conventional-commits@v1.1.0"
                }
            ]
        },
        init: {
            name: "Init",
            "runs-on": "webiny-build-packages",
            outputs: {
                day: "${{ steps.get-day.outputs.day }}",
                ts: "${{ steps.get-timestamp.outputs.ts }}",
                "is-fork-pr": "${{ steps.is-fork-pr.outputs.is-fork-pr }}"
            },
            steps: [
                ...createSetupSteps(),
                {
                    name: "Get day of the month",
                    id: "get-day",
                    run: 'echo "day=$(node --eval "console.log(new Date().getDate())")" >> $GITHUB_OUTPUT'
                },
                {
                    name: "Get timestamp",
                    id: "get-timestamp",
                    run: 'echo "ts=$(node --eval "console.log(new Date().getTime())")" >> $GITHUB_OUTPUT'
                },
                {
                    name: "Is a PR from a fork",
                    id: "is-fork-pr",
                    run: 'echo "is-fork-pr=${{ github.event.pull_request.head.repo.fork }}" >> $GITHUB_OUTPUT'
                },
                {
                    uses: "actions/cache@v3",
                    id: "yarn-cache",
                    with: {
                        path: ".yarn/cache",
                        key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
                    }
                },
                {
                    uses: "actions/cache@v3",
                    id: "cached-packages",
                    with: {
                        path: ".webiny/cached-packages",
                        key: "${{ runner.os }}-${{ steps.get-day.outputs.day }}-${{ secrets.RANDOM_CACHE_KEY_SUFFIX }}"
                    }
                },
                {
                    name: "Install dependencies",
                    run: "yarn --immutable"
                },
                {
                    name: "Build packages",
                    run: "yarn build:quick"
                },
                {
                    uses: "actions/cache@v3",
                    id: "packages-cache",
                    with: {
                        path: ".webiny/cached-packages",
                        key: "packages-cache-${{ steps.get-timestamp.outputs.ts }}"
                    }
                }
            ]
        },
        "code-analysis": {
            needs: "init",
            name: "Static code analysis",
            "runs-on": "ubuntu-latest",
            steps: [
                ...createSetupSteps(),
                {
                    uses: "actions/cache@v3",
                    with: {
                        path: ".yarn/cache",
                        key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
                    }
                },
                {
                    uses: "actions/cache@v3",
                    with: {
                        path: ".webiny/cached-packages",
                        key: "packages-cache-${{ needs.init.outputs.ts }}"
                    }
                },
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
        },
        "code-analysis-typescript": {
            name: "Static code analysis (TypeScript)",
            "runs-on": "webiny-build-packages",
            steps: [
                ...createSetupSteps(),
                {
                    uses: "actions/cache@v3",
                    with: {
                        path: ".yarn/cache",
                        key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
                    }
                },
                {
                    name: "Install dependencies",
                    run: "yarn --immutable"
                },
                {
                    name: "Build packages (full)",
                    run: "yarn build"
                }
            ]
        },
        ...createJestTestsJobs(null),
        // ...createJestTestsJobs("ddb"),
        // ...createJestTestsJobs("ddb-es"),
        // ...createJestTestsJobs("ddb-os"),
        // "jest-tests": {
        //     needs: "init",
        //     name: "${{ matrix.package.cmd }}",
        //     strategy: {
        //         "fail-fast": false,
        //         matrix: {
        //             os: ["ubuntu-latest"],
        //             node: [NODE_VERSION],
        //             package: "${{ fromJson(needs.init.outputs.jest-packages) }}"
        //         }
        //     },
        //     "runs-on": "${{ matrix.os }}",
        //     env: {
        //         AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
        //         AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
        //         AWS_ELASTIC_SEARCH_DOMAIN_NAME: "${{ secrets.AWS_ELASTIC_SEARCH_DOMAIN_NAME }}",
        //         ELASTIC_SEARCH_ENDPOINT: "${{ secrets.ELASTIC_SEARCH_ENDPOINT }}",
        //         ELASTIC_SEARCH_INDEX_PREFIX: "${{ matrix.package.id }}"
        //     },
        //     steps: [
        //         ...createSetupSteps(),
        //         {
        //             uses: "actions/cache@v3",
        //             with: {
        //                 path: ".yarn/cache",
        //                 key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
        //             }
        //         },
        //         {
        //             uses: "actions/cache@v3",
        //             with: {
        //                 path: ".webiny/cached-packages",
        //                 key: "packages-cache-${{ needs.init.outputs.ts }}"
        //             }
        //         },
        //         {
        //             name: "Install dependencies",
        //             run: "yarn --immutable"
        //         },
        //         {
        //             name: "Build packages",
        //             run: "yarn build:quick"
        //         },
        //         {
        //             name: "Run tests",
        //             run: "yarn test ${{ matrix.package.cmd }}"
        //         }
        //     ]
        // },
        "verdaccio-publish": {
            if: "needs.init.outputs.is-fork-pr != 'true'",
            needs: "init",
            name: "Publish to Verdaccio",
            "runs-on": "ubuntu-latest",
            steps: [
                {
                    uses: "actions/setup-node@v3",
                    with: {
                        "node-version": NODE_VERSION
                    }
                },
                {
                    uses: "actions/checkout@v3",
                    with: {
                        "fetch-depth": 0,
                        ref: "${{ github.event.pull_request.head.ref }}"
                    }
                },
                {
                    uses: "actions/cache@v3",
                    with: {
                        path: ".yarn/cache",
                        key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
                    }
                },
                {
                    uses: "actions/cache@v3",
                    with: {
                        path: ".webiny/cached-packages",
                        key: "packages-cache-${{ needs.init.outputs.ts }}"
                    }
                },
                {
                    name: "Install dependencies",
                    run: "yarn --immutable"
                },
                {
                    name: "Build packages",
                    run: "yarn build:quick"
                },
                ...createSetupVerdaccioSteps(),
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
                    uses: "actions/upload-artifact@v3",
                    with: {
                        name: "verdaccio-files",
                        "retention-days": 1,
                        path: ".verdaccio/\n.verdaccio.yaml\n"
                    }
                }
            ]
        },
        "test-create-webiny-project": {
            needs: "verdaccio-publish",
            name: 'Test "create-webiny-project"',
            strategy: {
                "fail-fast": false,
                matrix: {
                    os: ["ubuntu-latest"],
                    node: [NODE_VERSION]
                }
            },
            "runs-on": "${{ matrix.os }}",
            env: {
                YARN_ENABLE_IMMUTABLE_INSTALLS: false
            },
            steps: [
                {
                    uses: "actions/setup-node@v3",
                    with: {
                        "node-version": "${{ matrix.node }}"
                    }
                },
                {
                    uses: "actions/download-artifact@v3",
                    with: {
                        name: "verdaccio-files",
                        path: "verdaccio-files"
                    }
                },
                ...createSetupVerdaccioSteps({ workingDirectory: "verdaccio-files" }),
                {
                    name: "Disable Webiny telemetry",
                    run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
                },
                {
                    name: "Create a new Webiny project",
                    run: 'npx create-webiny-project@local-npm test-project --tag local-npm --no-interactive --assign-to-yarnrc \'{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}\' --template-options \'{"region":"eu-central-1"}\'\n'
                }
            ]
        }
    }
});
