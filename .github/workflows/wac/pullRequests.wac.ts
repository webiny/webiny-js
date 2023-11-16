import { createWorkflow, NormalJob } from "github-actions-wac";
import { createSetupVerdaccioSteps, createAwsCredentialsStep } from "./steps";
import { createValidateWorkflowsJob } from "./jobs";
import { NODE_OPTIONS, NODE_VERSION, listPackagesWithJestTests } from "./utils";

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

    const job: NormalJob = {
        needs: "init",
        name: "${{ matrix.package.cmd }}",

        // Required in order for the `aws-actions/configure-aws-credentials` to work.
        // https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#adding-permissions-settings
        permissions: { "id-token": "write" },

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
        steps: [
            ...createSetupSteps(),
            createAwsCredentialsStep(),
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

    // We prevent running of Jest tests if a PR was created from a fork.
    // This is because we don't want to expose our AWS credentials to forks.
    if (storage === "ddb-es" || storage === "ddb-os") {
        job.if = "needs.init.outputs.is-fork-pr != 'true'";
    }

    return job;
};

export const pullRequests = createWorkflow({
    name: "Pull Requests",
    on: {
        pull_request: {
            branches: ["next"]
        }
    },
    env: { NODE_OPTIONS },
    jobs: {
        validateWorkflows: createValidateWorkflowsJob(),
        validateCommits: {
            name: "Validate commit messages",
            "runs-on": "ubuntu-latest",
            steps: [
                { uses: "actions/checkout@v3" },
                { uses: "webiny/action-conventional-commits@v1.1.0" }
            ]
        },
        init: {
            name: "Init",
            "runs-on": "webiny-build-packages",
            outputs: {
                ts: "${{ steps.get-timestamp.outputs.ts }}",
                "is-fork-pr": "${{ steps.is-fork-pr.outputs.is-fork-pr }}"
            },
            steps: [
                ...createSetupSteps(),
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
                        key: "${{ runner.os }}-${{ github.event.number }}-${{ secrets.RANDOM_CACHE_KEY_SUFFIX }}"
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
        "jest-tests-no-storage": createJestTestsJob(null),
        "jest-tests-ddb": createJestTestsJob("ddb"),
        "jest-tests-ddb-es": createJestTestsJob("ddb-es"),
        // "jest-tests-ddb-os": createJestTestsJob("ddb-os"),
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
