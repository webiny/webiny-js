import { createWorkflow, NormalJob } from "github-actions-wac";
import {
    AWS_REGION,
    DEFAULT_RUNNER,
    createWaitForOpenSearchStep,
    NODE_VERSION,
    OPENSEARCH_SERVICE,
    runNodeScript
} from "./utils/index.js";
import { VALKEY_SERVICE } from "./utils/index.js";
import { VALKEY_TEST_URL } from "./utils/index.js";
import { createJob } from "./jobs/index.js";
import { createGlobalBuildCacheSteps } from "./steps/index.js";
import { createInstallBuildSteps } from "./steps/index.js";
import { createRunBuildCacheSteps } from "./steps/index.js";
import { createYarnCacheSteps } from "./steps/index.js";
import { withCommonParams } from "./steps/index.js";
import {
    createAwsJobs,
    createPublishToVerdaccioSteps,
    createStandaloneVariantJobs,
    createUploadVerdaccioStorageSteps,
    AWS_VARIANTS,
    SERVER_VARIANTS,
    WCP_VARIANTS,
    type AwsVariantJobsContext,
    type StandaloneVariantJobsContext
} from "./e2e/index.js";
import { AbstractStorageOps } from "./storageOps/AbstractStorageOps.js";
import { DdbOsStorageOps, DdbStorageOps, PgStorageOps, SqlStorageOps } from "./storageOps/index.js";

const ddbStorageOps = new DdbStorageOps();
const ddbOsStorageOps = new DdbOsStorageOps();
const sqlStorageOps = new SqlStorageOps();
const pgStorageOps = new PgStorageOps();

const DIR_WEBINY_JS = "v6";

const installBuildSteps = createInstallBuildSteps({
    workingDirectory: DIR_WEBINY_JS
});
const yarnCacheSteps = createYarnCacheSteps({
    workingDirectory: DIR_WEBINY_JS
});
const globalBuildCacheSteps = createGlobalBuildCacheSteps({
    workingDirectory: DIR_WEBINY_JS
});
const runBuildCacheSteps = createRunBuildCacheSteps({
    workingDirectory: DIR_WEBINY_JS
});

// E2E: the same variants (e2e/variants.ts) and the same jobs as the /e2e command workflow - one job
// that publishes to Verdaccio, then per variant a build (or deploy) job and a matrix of shards. No
// report jobs, since `push` has no PR comment to report into. Only the context differs: `push` tests
// the pushed commit, which the job's checkout already holds, and its caches are savable (a trusted
// trigger).
const E2E_PUBLISH_JOB = "e2eTests-publish";

const AWS_VARIANT_JOBS_CONTEXT: AwsVariantJobsContext = {
    workingDirectory: DIR_WEBINY_JS,
    jobKeyPrefix: "e2eTests-aws",
    deployNeeds: [E2E_PUBLISH_JOB],
    testsNeeds: [],
    setupSteps: yarnCacheSteps,
    report: false,
    // A trusted trigger, so this can save what `/e2e` restores.
    savePlaywrightCache: true
};

const STANDALONE_VARIANT_JOBS_CONTEXT: StandaloneVariantJobsContext = {
    workingDirectory: DIR_WEBINY_JS,
    jobKeyPrefix: "e2eTests-standalone",
    buildNeeds: [E2E_PUBLISH_JOB],
    testsNeeds: [],
    setupSteps: yarnCacheSteps,
    report: false,
    // A trusted trigger, so this can save what `/e2e` restores.
    savePlaywrightCache: true
};

const createE2EJobs = () => ({
    // Publishes the packages to Verdaccio once, for every deploy and build job to install from.
    [E2E_PUBLISH_JOB]: createJob({
        needs: ["constants", "build"],
        name: "E2E - Publish to Verdaccio",
        checkout: { path: DIR_WEBINY_JS },
        steps: [
            ...yarnCacheSteps,
            ...runBuildCacheSteps,
            ...installBuildSteps,
            ...createPublishToVerdaccioSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...createUploadVerdaccioStorageSteps({ workingDirectory: DIR_WEBINY_JS })
        ]
    }),
    ...AWS_VARIANTS.reduce(
        (jobs, variant) => ({
            ...jobs,
            ...createAwsJobs(variant, AWS_VARIANT_JOBS_CONTEXT)
        }),
        {}
    ),
    ...[...SERVER_VARIANTS, ...WCP_VARIANTS].reduce(
        (jobs, variant) => ({
            ...jobs,
            ...createStandaloneVariantJobs(variant, STANDALONE_VARIANT_JOBS_CONTEXT)
        }),
        {}
    )
});

const createVitestTestsJobs = (storageOps?: AbstractStorageOps) => {
    const jobNames = {
        constants: ["vitest", storageOps?.shortId, "constants"].filter(Boolean).join("-"),
        tests: ["vitest", storageOps?.shortId, "run"].filter(Boolean).join("-")
    };

    const env: Record<string, string> = { AWS_REGION };

    // The container needs no configuration at all - see `utils/openSearch.ts` for why there is no
    // endpoint, no credentials and no index prefix here.
    const needsOpenSearch = storageOps?.id === "ddb-os,ddb";

    // The "No storage" job runs the Redis message bus tests; see `utils/valkey.ts`.
    const needsValkey = !storageOps;
    if (needsValkey) {
        env["WEBINY_TEST_REDIS_URL"] = VALKEY_TEST_URL;
    }

    // One object for every service container the job needs, so adding one never replaces another.
    const services: Record<string, any> = {};
    if (needsOpenSearch) {
        Object.assign(services, OPENSEARCH_SERVICE);
    }
    if (needsValkey) {
        Object.assign(services, VALKEY_SERVICE);
    }
    const hasServices = Object.keys(services).length > 0;

    if (storageOps) {
        env["WEBINY_STORAGE"] = storageOps.id;

        // An in-process PGlite: no Postgres service.
        if (storageOps instanceof PgStorageOps) {
            env["WEBINY_SQL_CLIENT"] = "pglite";
        }
    }

    return {
        [jobNames.constants]: createJob({
            needs: ["build"],
            name: `Vitest (${storageOps ? storageOps.displayName : "No storage"}) - Constants`,
            checkout: { path: DIR_WEBINY_JS },
            outputs: {
                "vitest-test-commands":
                    "${{ steps.list-vitest-test-commands.outputs.vitest-test-commands }}"
            },
            steps: [
                {
                    id: "list-vitest-test-commands",
                    name: "List Vitest Test Commands",
                    "working-directory": DIR_WEBINY_JS,
                    run: runNodeScript("listVitestTestCommands", `["${storageOps?.id || ""}"]`, {
                        outputAs: "vitest-test-commands"
                    })
                }
            ]
        }),
        [jobNames.tests]: createJob({
            needs: ["constants", jobNames.constants],
            name: "${{ matrix.testCommand.title }}",
            strategy: {
                "fail-fast": false,
                matrix: {
                    os: [DEFAULT_RUNNER],
                    node: [NODE_VERSION],
                    testCommand: `$\{{ fromJSON(needs.${jobNames.constants}.outputs.vitest-test-commands) }}`
                }
            },
            "runs-on": "${{ matrix.os }}",
            env,
            awsAuth: !!storageOps,
            services: hasServices ? services : undefined,
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                ...(needsOpenSearch ? [createWaitForOpenSearchStep()] : []),
                {
                    name: "Run tests",
                    run: "${{ matrix.testCommand.cmd }}",
                    "working-directory": DIR_WEBINY_JS
                }
            ]
        })
    };
};

export const push = createWorkflow({
    name: `Push`,
    on: { push: { branches: ["dev", "next", "release/*"] } },
    // A newer push to dev or next makes the running workflow redundant, so it gets cancelled.
    // On release branches every run gets its own group, so each release commit gets a full
    // result. E2E infrastructure left behind by a cancelled run is removed by the nightly
    // `aws-nuke.yml` workflow in webiny/webiny-js-ci-infrastructure.
    concurrency: {
        group: "push-${{ startsWith(github.ref, 'refs/heads/release/') && github.run_id || github.ref }}",
        "cancel-in-progress": true
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
                    run: `echo "global-cache-key=\${{ github.ref_name }}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
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
            "runs-on": DEFAULT_RUNNER,
            steps: [
                ...yarnCacheSteps,
                ...globalBuildCacheSteps,
                ...installBuildSteps,
                ...runBuildCacheSteps
            ]
        }),
        codeAnalysis: createJob({
            name: "Static code analysis",
            needs: ["constants", "build"],
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
                            run: "yarn check:node-modules:ci"
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
            "runs-on": DEFAULT_RUNNER,
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...yarnCacheSteps,

                // We're not using run cache here. We want to build all packages
                // with TypeScript, to ensure there are no TypeScript errors.
                // ...runBuildCacheSteps,

                ...withCommonParams(
                    [
                        { name: "Install dependencies", run: "yarn --immutable" },
                        { name: "Check types for E2E tests", run: "yarn e2e:ts" }
                    ],
                    { "working-directory": DIR_WEBINY_JS }
                )
            ]
        }),
        ...createVitestTestsJobs(),
        ...createVitestTestsJobs(ddbStorageOps),
        ...createVitestTestsJobs(ddbOsStorageOps),
        ...createVitestTestsJobs(sqlStorageOps),
        ...createVitestTestsJobs(pgStorageOps),
        ...createE2EJobs()
    }
});
