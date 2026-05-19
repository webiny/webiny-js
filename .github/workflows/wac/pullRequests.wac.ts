import { createWorkflow, NormalJob } from "github-actions-wac";
import { createJob } from "./jobs/index.js";
import {
    NODE_VERSION,
    BUILD_PACKAGES_RUNNER,
    AWS_REGION,
    runNodeScript,
    addToOutputs
} from "./utils/index.js";
import {
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createRunBuildCacheSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";
import { AbstractStorageOps, DdbOsStorageOps, DdbStorageOps } from "./storageOps/index.js";

// Will print "next" or "dev". Important for caching (via actions/cache).
const DIR_WEBINY_JS = "${{ github.base_ref }}";

// Skip all jobs for release/x.y.z → next PRs (handled by a dedicated release workflow).
const NOT_RELEASE_PR = "!startsWith(github.head_ref, 'release/')";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });

const ddbStorageOps = new DdbStorageOps();
const ddbOsStorageOps = new DdbOsStorageOps();

const createVitestTestsJobs = (storageOps?: AbstractStorageOps) => {
    const jobNames = {
        constants: ["vitest", storageOps?.shortId, "constants"].filter(Boolean).join("-"),
        tests: ["vitest", storageOps?.shortId, "run"].filter(Boolean).join("-")
    };

    const constantsJob: NormalJob = createJob({
        needs: ["constants", "build"],
        checkout: { path: DIR_WEBINY_JS },
        name: `Vitest (${storageOps ? storageOps.displayName : "No storage"}) - Constants`,
        outputs: {
            "vitest-test-commands":
                "${{ steps.list-vitest-test-commands.outputs.vitest-test-commands }}"
        },
        steps: [
            {
                id: "list-vitest-test-commands",
                name: "List Vitest Test Commands",
                "working-directory": DIR_WEBINY_JS,
                run: runNodeScript(
                    "listVitestTestCommands",
                    `["${storageOps?.id || ""}", \${{ needs.constants.outputs.changed-packages }}]`,
                    { outputAs: "vitest-test-commands" }
                )
            },
            {
                name: "Packages to test with Vitest",
                id: "list-packages",
                run: "echo '${{ steps.list-vitest-test-commands.outputs.vitest-test-commands }}'"
            }
        ]
    });

    const env: Record<string, string> = { AWS_REGION };

    if (storageOps) {
        env["WEBINY_STORAGE"] = storageOps.id;
        if (storageOps.id === "ddb-os,ddb") {
            env["AWS_OPENSEARCH_DOMAIN_NAME"] = "${{ secrets.OPENSEARCH_DOMAIN_NAME }}";
            env["OPENSEARCH_ENDPOINT"] = "${{ secrets.OPENSEARCH_ENDPOINT }}";
            env["OPENSEARCH_USERNAME"] = "${{ secrets.OPENSEARCH_USERNAME }}";
            env["OPENSEARCH_PASSWORD"] = "${{ secrets.OPENSEARCH_PASSWORD }}";
            env["OPENSEARCH_INDEX_PREFIX"] = "${{ matrix.testCommand.id }}";
        }
    }

    const runJob: NormalJob = createJob({
        needs: ["constants", "build", jobNames.constants],
        name: "${{ matrix.testCommand.title }}",
        strategy: {
            "fail-fast": false,
            matrix: {
                os: ["ubuntu-latest"],
                node: [NODE_VERSION],
                testCommand: `$\{{ fromJSON(needs.${jobNames.constants}.outputs.vitest-test-commands) }}`
            }
        },
        "runs-on": "${{ matrix.os }}",
        env,
        if: `needs.${jobNames.constants}.outputs.vitest-test-commands != '[]'`,
        awsAuth: !!storageOps,
        checkout: { path: DIR_WEBINY_JS },
        steps: [
            ...yarnCacheSteps,
            ...runBuildCacheSteps,
            ...installBuildSteps,
            {
                name: "Run tests",
                run: "${{ matrix.testCommand.cmd }}",
                "working-directory": DIR_WEBINY_JS
            }
        ]
    });

    // We prevent running of Vitest tests if a PR was created from a fork.
    // This is because we don't want to expose our AWS credentials to forks.
    if (storageOps && storageOps.id === "ddb-os,ddb") {
        runJob.if += " && needs.constants.outputs.is-fork-pr != 'true'";
    }

    return {
        [jobNames.constants]: constantsJob,
        [jobNames.tests]: runJob
    };
};

export const pullRequests = createWorkflow({
    name: "Pull Requests",
    on: "pull_request",
    concurrency: {
        group: "pr-${{ github.event.pull_request.number }}",
        "cancel-in-progress": true
    },
    jobs: {
        validateCommits: createJob({
            name: "Validate commit messages",
            if: `github.base_ref != 'dev' && ${NOT_RELEASE_PR}`,
            steps: [{ uses: "webiny/action-conventional-commits@v1.4.2" }]
        }),
        // Don't allow "feat" commits to be merged into "dev" branch.
        validateCommitsDev: createJob({
            name: "Validate commit messages (dev branch, 'feat' commits not allowed)",
            if: `github.base_ref == 'dev' && ${NOT_RELEASE_PR}`,
            steps: [
                {
                    uses: "webiny/action-conventional-commits@v1.4.2",
                    with: {
                        // If dev, use "dev" commit types, otherwise use "next" commit types.
                        "allowed-commit-types":
                            "fix,docs,style,refactor,test,build,perf,ci,chore,revert,merge,wip"
                    }
                }
            ]
        }),
        constants: createJob({
            name: "Create constants",
            if: NOT_RELEASE_PR,
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}",
                "run-cache-key": "${{ steps.run-cache-key.outputs.run-cache-key }}",
                "is-fork-pr": "${{ steps.is-fork-pr.outputs.is-fork-pr }}",
                "changed-packages": "${{ steps.detect-changed-packages.outputs.changed-packages }}",
                "latest-webiny-version":
                    "${{ steps.latest-webiny-version.outputs.latest-webiny-version }}"
            },
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: addToOutputs(
                        "global-cache-key",
                        '${{ github.base_ref }}-${{ runner.os }}-$(/bin/date -u "+%m%d")-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}'
                    )
                },
                {
                    name: "Create workflow run cache key",
                    id: "run-cache-key",
                    run: addToOutputs(
                        "run-cache-key",
                        "${{ github.run_id }}-${{ github.run_attempt }}-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}"
                    )
                },
                {
                    name: "Is a PR from a fork",
                    id: "is-fork-pr",
                    run: addToOutputs(
                        "is-fork-pr",
                        "${{ github.event.pull_request.head.repo.fork }}"
                    )
                },
                {
                    name: "Detect changed files",
                    id: "detect-changed-files",
                    uses: "dorny/paths-filter@v4",
                    with: {
                        filters: "changed:\n  - 'packages/**/*'\n",
                        "list-files": "json"
                    }
                },
                {
                    name: "Detect changed packages",
                    id: "detect-changed-packages",
                    run: runNodeScript(
                        "listChangedPackages",
                        "${{ steps.detect-changed-files.outputs.changed_files }}",
                        { outputAs: "changed-packages" }
                    )
                },
                {
                    name: "Get latest Webiny version on NPM",
                    id: "latest-webiny-version",
                    run: addToOutputs("latest-webiny-version", "$(npm view @webiny/cli version)")
                }
            ]
        }),
        build: createJob({
            name: "Build",
            needs: "constants",
            "runs-on": BUILD_PACKAGES_RUNNER,
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...yarnCacheSteps,
                ...globalBuildCacheSteps,
                ...installBuildSteps,

                // Once we've built packages with the help of the global cache, we can now cache
                // the result for this run. All of the following jobs will use this cache.
                ...runBuildCacheSteps
            ]
        }),
        buildProject: createJob({
            needs: ["constants", "build"],
            name: "Build project (core, api, admin)",
            if: NOT_RELEASE_PR,
            env: { WEBINY_API_MAX_BUNDLE_SIZE: "${{ vars.WEBINY_API_MAX_BUNDLE_SIZE }}" },
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                {
                    name: "Build core",
                    run: "yarn webiny build core",
                    "working-directory": DIR_WEBINY_JS
                },
                {
                    name: "API bundle size limit",
                    run: 'echo "API bundle size limit: ${WEBINY_API_MAX_BUNDLE_SIZE:-10} MB"'
                },
                {
                    name: "Build api",
                    run: "yarn webiny build api --no-deployment-checks",
                    "working-directory": DIR_WEBINY_JS
                },
                {
                    name: "Build admin",
                    run: "yarn webiny build admin --no-deployment-checks",
                    "working-directory": DIR_WEBINY_JS
                }
            ]
        }),
        staticCodeAnalysis: createJob({
            needs: ["constants"],
            name: "Static code analysis",
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...withCommonParams(
                    [
                        { name: "Install dependencies", run: "yarn --immutable" },
                        { name: "Check code formatting", run: "yarn format:check" },
                        { name: "Check dependencies", run: "yarn adio" },
                        { name: "Check TS configs", run: "yarn check-ts-configs" },
                        { name: "Lint", run: "yarn lint" },
                        {
                            name: "Check Package Node Modules",
                            run: "yarn check-package-dependencies"
                        },
                        {
                            name: "Validate webiny package",
                            run: "yarn webiny-scripts validate-webiny-package"
                        }
                    ],
                    { "working-directory": DIR_WEBINY_JS }
                )
            ]
        }),

        // We couldn't add the `verify-dependencies` script to the `staticCodeAnalysis` job
        // because it requires the `build` job to run first. To not slow down the `staticCodeAnalysis`
        // and not to run the `build` job twice, we've created a separate job for this.
        staticCodeAnalysisVerifyDependencies: createJob({
            needs: ["constants", "build"],
            name: "Static code analysis (verify dependencies)",
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                {
                    name: "Sync Dependencies Verification",
                    run: "yarn verify-dependencies",
                    "working-directory": DIR_WEBINY_JS
                }
            ]
        }),
        staticCodeAnalysisTs: createJob({
            name: "Static code analysis (TypeScript)",
            if: NOT_RELEASE_PR,
            "runs-on": BUILD_PACKAGES_RUNNER,
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...yarnCacheSteps,

                // We're not using run cache here. We want to build all packages
                // with TypeScript, to ensure there are no TypeScript errors.
                // ...runBuildCacheSteps,

                ...withCommonParams(
                    [
                        { name: "Install dependencies", run: "yarn --immutable" },
                        { name: "Check types for Cypress tests", run: "yarn cy:ts" }
                    ],
                    { "working-directory": DIR_WEBINY_JS }
                )
            ]
        }),
        aiFixStaticAnalysis: createJob({
            name: "AI Fix Static Analysis",
            needs: ["constants", "staticCodeAnalysis"],
            if: "failure() && needs.staticCodeAnalysis.result == 'failure' && needs.constants.outputs.is-fork-pr != 'true'",
            permissions: { contents: "write" },
            checkout: { path: DIR_WEBINY_JS },
            env: { ANTHROPIC_API_KEY: "${{ secrets.ANTHROPIC_API_KEY }}" },
            steps: [
                ...yarnCacheSteps,
                {
                    name: "Install dependencies",
                    run: "yarn --immutable",
                    "working-directory": DIR_WEBINY_JS
                },
                // Run deterministic fixes as real shell commands so changes definitely land on disk.
                // Lint runs first because auto-fixes can produce code that needs re-formatting.
                {
                    name: "Fix lint issues (auto-fixable)",
                    run: "yarn lint:fix",
                    "working-directory": DIR_WEBINY_JS,
                    "continue-on-error": true
                },
                {
                    name: "Fix code formatting",
                    run: "yarn format:fix",
                    "working-directory": DIR_WEBINY_JS,
                    "continue-on-error": true
                },
                // Let Claude handle whatever can't be auto-fixed: adio, ts-configs,
                // remaining lint errors, and check-package-dependencies.
                {
                    name: "Install Claude Code",
                    run: "npm install -g @anthropic-ai/claude-code"
                },
                {
                    name: "AI Fix Remaining Issues",
                    "working-directory": DIR_WEBINY_JS,
                    run: [
                        `claude --dangerously-skip-permissions -p`,
                        `"Some static analysis checks may still be failing. Fix any remaining issues:`,
                        `1. Run 'yarn adio' — if it reports dependency errors, fix the relevant package.json files.`,
                        `2. Run 'yarn check-ts-configs' — if it reports errors, fix them.`,
                        `3. Run 'yarn lint' — if there are still non-auto-fixable errors, read the affected files and fix them.`,
                        `4. Run 'yarn check-package-dependencies' — if it reports errors, fix them.`,
                        `Work in the current directory."`
                    ].join(" ")
                },
                // Re-run yarn so yarn.lock is updated if package.json files were modified (e.g. by adio fixes).
                {
                    name: "Update yarn.lock",
                    run: "yarn",
                    "working-directory": DIR_WEBINY_JS
                },
                {
                    name: "Commit fixes",
                    uses: "stefanzweifel/git-auto-commit-action@v5",
                    with: {
                        commit_message: "chore: ai fix static analysis",
                        repository: DIR_WEBINY_JS
                    }
                }
            ]
        }),
        ...createVitestTestsJobs(),
        ...createVitestTestsJobs(ddbStorageOps),
        ...createVitestTestsJobs(ddbOsStorageOps)
    }
});
