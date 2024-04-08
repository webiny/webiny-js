import { createWorkflow, NormalJob } from "github-actions-wac";
import { listPackagesWithJestTests, NODE_VERSION, BUILD_PACKAGES_RUNNER } from "./utils";
import { createJob } from "./jobs";
import {
    createDeployWebinySteps,
    createSetupVerdaccioSteps,
    createInstallBuildSteps,
    createYarnCacheSteps,
    createGlobalBuildCacheSteps,
    createRunBuildCacheSteps
} from "./steps";

const withCommonParams = (
    steps: NonNullable<NormalJob["steps"]>,
    commonParams: Record<string, any>
) => steps.map(step => ({ ...step, ...commonParams }));

const createPushWorkflow = (branchName: string) => {
    const ucFirstBranchName = branchName.charAt(0).toUpperCase() + branchName.slice(1);

    const DIR_WEBINY_JS = branchName;
    const DIR_TEST_PROJECT = "new-webiny-project";

    const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
    const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS });
    const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });
    const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });

    const createCypressJobs = (dbSetup: string) => {
        const ucFirstDbSetup = dbSetup.charAt(0).toUpperCase() + dbSetup.slice(1);

        const jobNames = {
            constants: `e2eTests${ucFirstDbSetup}-constants`,
            projectSetup: `e2eTests${ucFirstDbSetup}-setup`,
            cypressTests: `e2eTests${ucFirstDbSetup}-cypress`
        };

        const constantsJob: NormalJob = createJob({
            name: `Constants - ${dbSetup.toUpperCase()}`,
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
                    run: `echo "pulumi-backend-url=\${{ secrets.WEBINY_PULUMI_BACKEND }}\${{ github.run_id }}_${dbSetup}" >> $GITHUB_OUTPUT`
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

        if (dbSetup === "ddb-es") {
            env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_ELASTIC_SEARCH_DOMAIN_NAME }}";
            env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.ELASTIC_SEARCH_ENDPOINT }}";
            env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ github.run_id }}_";
        } else if (dbSetup === "ddb-os") {
            // We still use the same environment variables as for "ddb-es" setup, it's
            // just that the values are read from different secrets.
            env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_OPEN_SEARCH_DOMAIN_NAME }}";
            env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.OPEN_SEARCH_ENDPOINT }}";
            env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ github.run_id }}_";
        }

        const projectSetupJob: NormalJob = createJob({
            needs: ["constants", "build", jobNames.constants],
            name: `E2E (${dbSetup.toUpperCase()}) - Project setup`,
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
                        name: `verdaccio-files-${dbSetup}`,
                        "retention-days": 1,
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
                    run: `npx create-webiny-project@local-npm ${DIR_TEST_PROJECT} --tag local-npm --no-interactive --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}' --template-options '{"region":"$\{{ env.AWS_REGION }}","storageOperations":"${dbSetup}"}'
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
                        name: `project-files-${dbSetup}`,
                        "retention-days": 1,
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

        const cypressTestsJob = createJob({
            name: `$\{{ matrix.cypress-folder }} (${dbSetup}, $\{{ matrix.os }}, Node v$\{{ matrix.node }})`,
            needs: ["constants", jobNames.constants, jobNames.projectSetup],
            strategy: {
                "fail-fast": false,
                matrix: {
                    os: ["ubuntu-latest"],
                    node: [NODE_VERSION],
                    "cypress-folder": `$\{{ fromJson(needs.${jobNames.constants}.outputs.cypress-folders) }}`
                }
            },
            environment: "next",
            env,
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                ...withCommonParams(
                    [
                        {
                            name: "Set up Cypress config",
                            run: `echo '$\{{ needs.${jobNames.projectSetup}.outputs.cypress-config }}' > cypress-tests/cypress.config.ts`
                        },
                        {
                            name: 'Cypress - run "${{ matrix.cypress-folder }}" tests',
                            "timeout-minutes": 40,
                            run: 'yarn cy:run --browser chrome --spec "${{ matrix.cypress-folder }}"'
                        }
                    ],
                    { "working-directory": DIR_WEBINY_JS }
                )
            ]
        });

        return {
            [jobNames.constants]: constantsJob,
            [jobNames.projectSetup]: projectSetupJob,
            [jobNames.cypressTests]: cypressTestsJob
        };
    };

    const createJestTestsJob = (storage: string | null) => {
        const env: Record<string, string> = {};

        if (storage) {
            if (storage === "ddb-es") {
                env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] =
                    "${{ secrets.AWS_ELASTIC_SEARCH_DOMAIN_NAME }}";
                env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.ELASTIC_SEARCH_ENDPOINT }}";
                env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ matrix.package.id }}";
            } else if (storage === "ddb-os") {
                // We still use the same environment variables as for "ddb-es" setup, it's
                // just that the values are read from different secrets.
                env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] =
                    "${{ secrets.AWS_OPEN_SEARCH_DOMAIN_NAME }}";
                env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.OPEN_SEARCH_ENDPOINT }}";
                env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ matrix.package.id }}";
            }
        }

        const packages = listPackagesWithJestTests({ storage });

        return createJob({
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
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                ...withCommonParams(
                    [{ name: "Run tests", run: "yarn test ${{ matrix.package.cmd }}" }],
                    { "working-directory": DIR_WEBINY_JS }
                )
            ]
        });
    };

    const workflow = createWorkflow({
        name: `${ucFirstBranchName} Branch - Push`,
        on: { push: { branches: [branchName] } },
        jobs: {
            // validateWorkflows: createValidateWorkflowsJob(),
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
                            { name: "ESLint", run: "yarn eslint" }
                        ],
                        { "working-directory": DIR_WEBINY_JS }
                    )
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
                            { name: "Build packages (full)", run: "yarn build" },
                            { name: "Check types for Cypress tests", run: "yarn cy:ts" }
                        ],
                        { "working-directory": DIR_WEBINY_JS }
                    )
                ]
            }),
            jestTestsNoStorage: createJestTestsJob(null),
            jestTestsDdb: createJestTestsJob("ddb"),
            jestTestsDdbEs: createJestTestsJob("ddb-es"),
            jestTestsDdbOs: createJestTestsJob("ddb-os"),
            ...createCypressJobs("ddb"),
            ...createCypressJobs("ddb-es"),
            ...createCypressJobs("ddb-os")
        }
    });

    if (branchName === "next") {
        const jestJobsNames = Object.keys(workflow.jobs).filter(name => name.startsWith("jest"));
        const e2eJobsNames = Object.keys(workflow.jobs).filter(name => name.endsWith("cypress"));

        workflow.jobs.npmReleaseUnstable = createJob({
            needs: ["constants", "codeAnalysis", ...jestJobsNames, ...e2eJobsNames],
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
