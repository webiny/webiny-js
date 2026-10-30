import { createWorkflow, NormalJob } from "github-actions-wac";
import {
    ACTION,
    AWS_REGION,
    BUILD_PACKAGES_RUNNER,
    DEFAULT_RUNNER,
    createWaitForOpenSearchStep,
    NODE_VERSION,
    OPENSEARCH_SERVICE,
    runNodeScript
} from "./utils/index.js";
import { VALKEY_SERVICE } from "./utils/index.js";
import { VALKEY_TEST_URL } from "./utils/index.js";
import { createJob } from "./jobs/index.js";
import { createConfigureBugReporterSteps } from "./steps/index.js";
import { createDeployWebinySteps } from "./steps/index.js";
import { createGlobalBuildCacheSteps } from "./steps/index.js";
import { createInstallBuildSteps } from "./steps/index.js";
import { createRunBuildCacheSteps } from "./steps/index.js";
import { createSetupVerdaccioSteps } from "./steps/index.js";
import { createYarnCacheSteps } from "./steps/index.js";
import { withCommonParams } from "./steps/index.js";
import { BUG_REPORTER_ENV } from "./steps/index.js";
import {
    createInstallationTestSteps,
    createStandaloneProjectParts,
    createUnlicensedE2eSteps,
    type StandaloneStorageOps
} from "./e2e/index.js";
import { AbstractStorageOps } from "./storageOps/AbstractStorageOps.js";
import { DdbOsStorageOps, DdbStorageOps, SqlStorageOps } from "./storageOps/index.js";

const ddbStorageOps = new DdbStorageOps();
const ddbOsStorageOps = new DdbOsStorageOps();
const sqlStorageOps = new SqlStorageOps();

const DIR_WEBINY_JS = "v6";
const DIR_TEST_PROJECT = "new-webiny-project";
// Absolute, for steps that run from DIR_WEBINY_JS and so cannot reach the project by name.
const PATH_TEST_PROJECT = `\${{ github.workspace }}/${DIR_TEST_PROJECT}`;

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

// Self-hosted ("server" hosting type) E2E, sharing its whole project lifecycle with the /e2e
// command workflow. Only the wrapper differs: `push` checks out the pushed ref rather than a PR,
// gets the build output from the run CACHE (a trusted trigger, so cache writes work) rather than
// from an artifact, and has no PR comment to report into.
const createStandaloneE2EJobs = (storageOps: StandaloneStorageOps) => {
    const parts = createStandaloneProjectParts(storageOps, {
        workingDirectory: DIR_WEBINY_JS,
        verdaccio: "publish",
        // A trusted trigger, so this can save what `/e2e` restores.
        savePlaywrightCache: true
    });

    return {
        [`e2eTests-standalone-${storageOps}`]: createJob({
            needs: ["constants", "build"],
            name: `E2E (Standalone ${storageOps === "postgres" ? "Postgres" : "SQLite"})`,
            checkout: { path: DIR_WEBINY_JS },
            ...(parts.services ? { services: parts.services } : {}),
            steps: [...yarnCacheSteps, ...runBuildCacheSteps, ...installBuildSteps, ...parts.steps]
        })
    };
};

// Pulumi state stays in the project's local `.pulumi` folder and goes away with the runner. The
// nightly `cleanup.yml` removes what was deployed with aws-nuke, so nothing needs the state later.
const createAwsE2EJobs = (storageOps: AbstractStorageOps) => {
    const jobNames = {
        projectSetup: `e2eTests-${storageOps.shortId}-setup`
    };

    const env: Record<string, string> = {
        PULUMI_CONFIG_PASSPHRASE: "${{ secrets.PULUMI_CONFIG_PASSPHRASE }}",
        PULUMI_SECRETS_PROVIDER: "${{ secrets.PULUMI_SECRETS_PROVIDER }}",
        YARN_ENABLE_IMMUTABLE_INSTALLS: "false",
        WEBINY_INFRA_API_MAX_BUNDLE_SIZE: "${{ vars.WEBINY_INFRA_API_MAX_BUNDLE_SIZE }}",
        /*
         * Read by `<Project.BugReporter>` while `webiny deploy api` builds, so it has to be on the
         * job that deploys, not only on the step that edits the config.
         */
        ...BUG_REPORTER_ENV
    };

    if (storageOps.id === "ddb-os,ddb") {
        env["AWS_OPENSEARCH_DOMAIN_NAME"] = "${{ secrets.OPENSEARCH_DOMAIN_NAME }}";
        env["OPENSEARCH_ENDPOINT"] = "${{ secrets.OPENSEARCH_ENDPOINT }}";
        env["OPENSEARCH_USERNAME"] = "${{ secrets.OPENSEARCH_USERNAME }}";
        env["OPENSEARCH_PASSWORD"] = "${{ secrets.OPENSEARCH_PASSWORD }}";
        env["OPENSEARCH_INDEX_PREFIX"] = "${{ github.run_id }}_";
    }

    const projectSetupJob: NormalJob = createJob({
        needs: ["constants", "build"],
        "runs-on": BUILD_PACKAGES_RUNNER,
        name: `E2E (${storageOps.displayName}) - Project setup`,
        environment: "next",
        env,
        checkout: {
            "fetch-depth": 0,
            path: DIR_WEBINY_JS
        },
        awsAuth: true,
        steps: [
            ...yarnCacheSteps,
            ...runBuildCacheSteps,
            ...installBuildSteps,
            ...createSetupVerdaccioSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...withCommonParams(
                [
                    {
                        name: 'Create ".npmrc" file in the project root, with a dummy auth token',
                        run: "echo '//localhost:4873/:_authToken=\"dummy-auth-token\"' > .npmrc"
                    },
                    {
                        name: "Version and publish to Verdaccio",
                        run: "yarn release --type=verdaccio"
                    }
                ],
                { "working-directory": DIR_WEBINY_JS }
            ),
            {
                name: "Create verdaccio-files artifact",
                uses: ACTION.uploadArtifactV6,
                with: {
                    name: `verdaccio-files-${storageOps.shortId}`,
                    "retention-days": 1,
                    "include-hidden-files": true,
                    path: [DIR_WEBINY_JS + "/.verdaccio/", DIR_WEBINY_JS + "/.verdaccio.yaml"].join(
                        "\n"
                    )
                }
            },
            {
                name: "Disable Webiny telemetry",
                run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
            },
            {
                name: "Create a new Webiny project",
                run: `npx create-webiny-project@local-npm ${DIR_TEST_PROJECT} --tag local-npm --no-interactive --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}' --template-options '{"region":"${AWS_REGION}","storageOps":"${storageOps.shortId}"}'
`
            },
            ...(storageOps.shortId === "ddb-os"
                ? [
                      {
                          name: "Configure OpenSearch domain name and index prefix in webiny.config.tsx",
                          "working-directory": DIR_TEST_PROJECT,
                          run: `sed -i 's|<Infra.OpenSearch enabled={true} />|<Infra.OpenSearch enabled={true} domainName={process.env.AWS_OPENSEARCH_DOMAIN_NAME \\|\\| "webiny-e2e-os"} indexPrefix={process.env.OPENSEARCH_INDEX_PREFIX \\|\\| ""} endpoint={process.env.OPENSEARCH_ENDPOINT} username={process.env.OPENSEARCH_USERNAME} password={process.env.OPENSEARCH_PASSWORD} />|g' webiny.config.tsx`
                      }
                  ]
                : []),
            ...createConfigureBugReporterSteps({
                workingDirectory: DIR_WEBINY_JS,
                projectPath: PATH_TEST_PROJECT
            }),
            {
                name: "Print CLI version",
                "working-directory": DIR_TEST_PROJECT,
                run: "yarn webiny --version"
            },
            {
                name: "Create project-files artifact",
                uses: ACTION.uploadArtifactV6,
                with: {
                    name: `project-files-${storageOps.shortId}`,
                    "retention-days": 1,
                    "include-hidden-files": true,
                    path: [
                        `${DIR_TEST_PROJECT}/`,
                        `!${DIR_TEST_PROJECT}/node_modules/**/*`,
                        `!${DIR_TEST_PROJECT}/**/node_modules/**/*`,
                        `!${DIR_TEST_PROJECT}/.yarn/cache/**/*`
                    ].join("\n")
                }
            },
            {
                name: "Enable extension whitelabeling",
                "working-directory": DIR_TEST_PROJECT,
                run: "yarn webiny extension whitelabeling"
            },
            {
                /*
                 * Pulled from S3 like any other published extension, so this covers the install
                 * path a customer takes as well as the extension itself. Drafting falls back to
                 * the reporter's own words here, since no AI provider is configured: provider keys
                 * are encrypted runtime settings, not build params, so CI has no way to set one.
                 */
                name: "Enable extension bug-report-ai",
                "working-directory": DIR_TEST_PROJECT,
                run: "yarn webiny extension bug-report-ai"
            },
            {
                name: "API bundle size limit",
                run: 'echo "API bundle size limit: ${WEBINY_INFRA_API_MAX_BUNDLE_SIZE:-6291456} bytes"'
            },
            ...createDeployWebinySteps({ workingDirectory: DIR_TEST_PROJECT }),
            ...(storageOps.shortId === "ddb-os"
                ? [
                      {
                          name: "Verify DDB+OS deployment",
                          "working-directory": DIR_TEST_PROJECT,
                          run: `OUTPUT=$(yarn webiny output core --env dev --json) && echo "$OUTPUT" && echo "$OUTPUT" | jq -e '.databaseSetup == "ddb+os"' || (echo "ERROR: Expected databaseSetup to be 'ddb+os' but got a different value" && exit 1)`
                      }
                  ]
                : []),
            {
                name: "Extract admin app URL",
                id: "admin-url",
                "working-directory": DIR_TEST_PROJECT,
                run: `echo "admin-url=$(yarn webiny output admin --env dev --json 2>/dev/null | jq -r '.appUrl // empty')" >> $GITHUB_OUTPUT`
            },
            ...createInstallationTestSteps({
                workingDirectory: DIR_WEBINY_JS,
                adminUrl: "${{ steps.admin-url.outputs.admin-url }}",
                artifactName: `e2e-results-${storageOps.shortId}`,
                savePlaywrightCache: true
            }),
            ...createUnlicensedE2eSteps({
                workingDirectory: DIR_WEBINY_JS,
                adminUrl: "${{ steps.admin-url.outputs.admin-url }}",
                artifactName: `e2e-test-results-${storageOps.shortId}`
            })
        ]
    });

    return {
        [jobNames.projectSetup]: projectSetupJob
    };
};

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
    // cleanup workflow.
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
            "runs-on": BUILD_PACKAGES_RUNNER,
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
        ...createAwsE2EJobs(ddbStorageOps),
        ...createAwsE2EJobs(ddbOsStorageOps),
        ...createStandaloneE2EJobs("sqlite"),
        ...createStandaloneE2EJobs("postgres")
    }
});
