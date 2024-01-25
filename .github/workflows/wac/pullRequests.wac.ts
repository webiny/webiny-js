import { createWorkflow } from "github-actions-wac";
import { createValidateWorkflowsJob, createJestTestsJob, createJob } from "./jobs";
import { NODE_VERSION } from "./utils";

export const pullRequests = createWorkflow({
    name: "Pull Requests",
    on: "pull_request",
    jobs: {
        validateWorkflows: createValidateWorkflowsJob(),
        validateCommits: createJob({
            name: "Validate commit messages",
            if: "github.base_ref != 'dev'",
            steps: [{ uses: "webiny/action-conventional-commits@v1.2.0" }]
        }),
        // Don't allow "feat" commits to be merged into "dev" branch.
        validateCommitsDev: createJob({
            name: "Validate commit messages (dev branch, 'feat' commits not allowed)",
            if: "github.base_ref == 'dev'",
            steps: [
                {
                    uses: "webiny/action-conventional-commits@v1.2.0",
                    with: {
                        // If dev, use "dev" commit types, otherwise use "next" commit types.
                        "allowed-commit-types":
                            "fix,docs,style,refactor,test,build,perf,ci,chore,revert,merge,wip"
                    }
                }
            ]
        }),
        init: createJob({
            name: "Init",
            "runs-on": "webiny-build-packages",
            outputs: {
                ts: "${{ steps.get-timestamp.outputs.ts }}",
                "is-fork-pr": "${{ steps.is-fork-pr.outputs.is-fork-pr }}"
            },
            steps: [
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
        }),
        staticCodeAnalysis: createJob({
            needs: "init",
            name: "Static code analysis",
            steps: [
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
        }),
        staticCodeAnalysisTs: createJob({
            name: "Static code analysis (TypeScript)",
            "runs-on": "webiny-build-packages",
            steps: [
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
            needs: "init",
            if: "needs.init.outputs.is-fork-pr != 'true'",
            checkout: {
                "fetch-depth": 0,
                ref: "${{ github.event.pull_request.head.ref }}"
            },
            steps: [
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
                    uses: "actions/upload-artifact@v3",
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
                    uses: "actions/download-artifact@v3",
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
