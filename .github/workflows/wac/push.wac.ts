import { createWorkflow, NormalJob } from "github-actions-wac";
import { AWS_REGION, BUILD_PACKAGES_RUNNER, NODE_VERSION, runNodeScript } from "./utils/index.js";
import { createJob } from "./jobs/index.js";
import {
    createDeployWebinySteps,
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createRunBuildCacheSteps,
    createSetupVerdaccioSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";
import { AbstractStorageOps } from "./storageOps/AbstractStorageOps.js";
import { DdbStorageOps, DdbEsStorageOps, DdbOsStorageOps } from "./storageOps/index.js";

const ddbStorageOps = new DdbStorageOps();
const ddbEsStorageOps = new DdbEsStorageOps();
const ddbOsStorageOps = new DdbOsStorageOps();

const createPushWorkflow = (branchName: string) => {
    const ucFirstBranchName = branchName.charAt(0).toUpperCase() + branchName.slice(1);

    const DIR_WEBINY_JS = branchName.replace("/", "_");
    const DIR_TEST_PROJECT = "new-webiny-project";

    const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
    const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS });
    const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });
    const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });

    const createE2EJobs = (storageOps: AbstractStorageOps) => {
        const jobNames = {
            constants: `e2eTests-${storageOps.shortId}-constants`,
            projectSetup: `e2eTests-${storageOps.shortId}-setup`,
            cypressTests: `e2eTests-${storageOps.shortId}-cypress`
        };

        const constantsJob: NormalJob = createJob({
            name: `E2E (${storageOps.displayName}) - Constants`,
            needs: ["build"],
            outputs: {
                "cypress-folders": "${{ steps.list-cypress-folders.outputs.cypress-folders }}",
                "pulumi-backend-url": "${{ steps.pulumi-backend-url.outputs.pulumi-backend-url }}"
            },
            steps: [
                {
                    name: "List Cypress tests folders",
                    id: "list-cypress-folders",
                    run: 'echo "cypress-folders=$(node scripts/listCypressTestsFolders.js)" >> $GITHUB_OUTPUT'
                },
                {
                    name: "Get Pulumi backend URL",
                    id: "get-pulumi-backend-url",
                    run: `echo "pulumi-backend-url=\${{ secrets.WEBINY_PULUMI_BACKEND }}\${{ github.run_id }}_${storageOps.shortId}" >> $GITHUB_OUTPUT`
                }
            ]
        });

        const env: Record<string, string> = {
            CYPRESS_MAILOSAUR_API_KEY: "${{ secrets.CYPRESS_MAILOSAUR_API_KEY }}",
            PULUMI_CONFIG_PASSPHRASE: "${{ secrets.PULUMI_CONFIG_PASSPHRASE }}",
            PULUMI_SECRETS_PROVIDER: "${{ secrets.PULUMI_SECRETS_PROVIDER }}",
            WEBINY_PULUMI_BACKEND: `\${{ needs.${jobNames.constants}.outputs.pulumi-backend-url }}`,
            YARN_ENABLE_IMMUTABLE_INSTALLS: "false"
        };

        if (storageOps.id === "ddb-es,ddb") {
            env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_ELASTIC_SEARCH_DOMAIN_NAME }}";
            env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.ELASTIC_SEARCH_ENDPOINT }}";
            env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ github.run_id }}_";
        } else if (storageOps.id === "ddb-os,ddb") {
            // We still use the same environment variables as for "ddb-es" setup, it's
            // just that the values are read from different secrets.
            env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_OPEN_SEARCH_DOMAIN_NAME }}";
            env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.OPEN_SEARCH_ENDPOINT }}";
            env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ github.run_id }}_";
        }

        const projectSetupJob: NormalJob = createJob({
            needs: ["constants", "build", jobNames.constants],
            "runs-on": BUILD_PACKAGES_RUNNER,
            name: `E2E (${storageOps.displayName}) - Project setup`,
            outputs: {
                "cypress-config": "${{ steps.save-cypress-config.outputs.cypress-config }}"
            },
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
                    uses: "actions/upload-artifact@v4",
                    with: {
                        name: `verdaccio-files-${storageOps.shortId}`,
                        "retention-days": 1,
                        "include-hidden-files": true,
                        path: [
                            DIR_WEBINY_JS + "/.verdaccio/",
                            DIR_WEBINY_JS + "/.verdaccio.yaml"
                        ].join("\n")
                    }
                },
                {
                    name: "Disable Webiny telemetry",
                    run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
                },
                {
                    name: "Create a new Webiny project",
                    run: `npx create-webiny-project@local-npm ${DIR_TEST_PROJECT} --tag local-npm --no-interactive --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}' --template-options '{"region":"${AWS_REGION}","storageOperations":"${storageOps.shortId}"}'
`
                },
                {
                    name: "Print CLI version",
                    "working-directory": DIR_TEST_PROJECT,
                    run: "yarn webiny --version"
                },
                {
                    name: "Create project-files artifact",
                    uses: "actions/upload-artifact@v4",
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
                ...createDeployWebinySteps({ workingDirectory: DIR_TEST_PROJECT }),
                ...withCommonParams(
                    [
                        // Commented this out b/c of an issue. Basically, the
                        // script fails b/c its output is not pure JSON string.
                        // {
                        //     name: "Deployment Summary",
                        //     run: `${runNodeScript(
                        //         "printDeploymentSummary",
                        //         `../${DIR_TEST_PROJECT}`
                        //     )} >> $GITHUB_STEP_SUMMARY`
                        // },
                        {
                            name: "Create Cypress config",
                            run: `yarn setup-cypress --projectFolder ../${DIR_TEST_PROJECT}`
                        },
                        {
                            name: "Save Cypress config",
                            id: "save-cypress-config",
                            run: "echo \"cypress-config=$(cat cypress-tests/cypress.config.ts | tr -d '\\t\\n\\r')\" >> $GITHUB_OUTPUT"
                        },
                        {
                            name: "Cypress - run installation wizard test",
                            run: 'yarn cy:run --browser chrome --spec "cypress/e2e/adminInstallation/**/*.cy.js"'
                        }
                    ],
                    { "working-directory": DIR_WEBINY_JS }
                )
            ]
        });

        // We're disabling Cypress tests for now, as they need to be updated for v6.
        // We'll probably enable them in a later phase.
        // const cypressTestsJob = createJob({
        //     name: `$\{{ matrix.cypress-folder }} (${storageOps.shortId}, $\{{ matrix.os }}, Node v$\{{ matrix.node }})`,
        //     needs: ["constants", jobNames.constants, jobNames.projectSetup],
        //     strategy: {
        //         "fail-fast": false,
        //         matrix: {
        //             os: ["ubuntu-latest"],
        //             node: [NODE_VERSION],
        //             "cypress-folder": `$\{{ fromJson(needs.${jobNames.constants}.outputs.cypress-folders) }}`
        //         }
        //     },
        //     environment: "next",
        //     env,
        //     checkout: { path: DIR_WEBINY_JS },
        //     steps: [
        //         ...yarnCacheSteps,
        //         ...runBuildCacheSteps,
        //         ...installBuildSteps,
        //         ...withCommonParams(
        //             [
        //                 {
        //                     name: "Set up Cypress config",
        //                     run: `echo '$\{{ needs.${jobNames.projectSetup}.outputs.cypress-config }}' > cypress-tests/cypress.config.ts`
        //                 },
        //                 {
        //                     name: 'Cypress - run "${{ matrix.cypress-folder }}" tests',
        //                     "timeout-minutes": 40,
        //                     run: 'yarn cy:run --browser chrome --spec "${{ matrix.cypress-folder }}"'
        //                 }
        //             ],
        //             { "working-directory": DIR_WEBINY_JS }
        //         )
        //     ]
        // });

        return {
            [jobNames.constants]: constantsJob,
            [jobNames.projectSetup]: projectSetupJob
            // [jobNames.cypressTests]: cypressTestsJob
        };
    };

    const createVitestTestsJobs = (storageOps?: AbstractStorageOps) => {
        const jobNames = {
            constants: ["vitest", storageOps?.shortId, "constants"].filter(Boolean).join("-"),
            tests: ["vitest", storageOps?.shortId, "run"].filter(Boolean).join("-")
        };

        const env: Record<string, string> = { AWS_REGION };

        if (storageOps) {
            env["WEBINY_STORAGE"] = storageOps.id;
            if (storageOps.id === "ddb-es,ddb") {
                env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] =
                    "${{ secrets.AWS_ELASTIC_SEARCH_DOMAIN_NAME }}";
                env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.ELASTIC_SEARCH_ENDPOINT }}";
                env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ matrix.testCommand.id }}";
            } else if (storageOps.id === "ddb-os,ddb") {
                // We still use the same environment variables as for "ddb-es" setup, it's
                // just that the values are read from different secrets.
                env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] =
                    "${{ secrets.AWS_OPEN_SEARCH_DOMAIN_NAME }}";
                env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.OPEN_SEARCH_ENDPOINT }}";
                env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ matrix.testCommand.id }}";
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
                        run: runNodeScript(
                            "listVitestTestCommands",
                            `["${storageOps?.id || ""}"]`,
                            { outputAs: "vitest-test-commands" }
                        )
                    }
                ]
            }),
            [jobNames.tests]: createJob({
                needs: ["constants", jobNames.constants],
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
            })
        };
    };

    const workflow = createWorkflow({
        name: `${ucFirstBranchName} Branch - Push`,
        on: { push: { branches: [branchName] } },
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
                        run: `echo "global-cache-key=${branchName}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
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
                            { name: "Check code formatting", run: "yarn prettier:check" },
                            { name: "Check dependencies", run: "yarn adio" },
                            { name: "Check TS configs", run: "yarn check-ts-configs" },
                            { name: "ESLint", run: "yarn eslint" },
                            {
                                name: "Check Package Node Modules",
                                run: "yarn check-package-dependencies"
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
                            { name: "Check types for Cypress tests", run: "yarn cy:ts" }
                        ],
                        { "working-directory": DIR_WEBINY_JS }
                    )
                ]
            }),
            ...createVitestTestsJobs(),
            ...createVitestTestsJobs(ddbStorageOps),
            ...createVitestTestsJobs(ddbEsStorageOps),
            ...createVitestTestsJobs(ddbOsStorageOps),
            ...createE2EJobs(ddbStorageOps),
            ...createE2EJobs(ddbEsStorageOps),
            ...createE2EJobs(ddbOsStorageOps)
        }
    });

    if (branchName === "next") {
        const vitestJobsNames = Object.keys(workflow.jobs).filter(
            name => name.startsWith("vitest") && name.endsWith("run")
        );
        const e2eJobsNames = Object.keys(workflow.jobs).filter(
            name => name.startsWith("e2eTests") && name.endsWith("setup")
        );

        workflow.jobs.npmReleaseUnstable = createJob({
            needs: ["constants", "codeAnalysis", ...vitestJobsNames, ...e2eJobsNames],
            name: 'NPM release ("unstable" tag)',
            environment: "release",
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}"
            },
            checkout: { "fetch-depth": 0 },
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
                            name: "Set git info",
                            run: 'git config --global user.email "webiny-bot@webiny.com"\ngit config --global user.name "webiny-bot"\n'
                        },
                        { name: "Version and publish to NPM", run: "yarn release --type=unstable" }
                    ],
                    { "working-directory": DIR_WEBINY_JS }
                )
            ]
        });
    }

    return workflow;
};
export const pushDev = createPushWorkflow("dev");
export const pushNext = createPushWorkflow("next");
