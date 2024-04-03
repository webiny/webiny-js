import { createWorkflow, NormalJob } from "github-actions-wac";
import { createJestTestsJob, createJob, createValidateWorkflowsJob } from "./jobs";
import { createDeployWebinySteps, createSetupVerdaccioSteps } from "./steps";
import { NODE_VERSION } from "./utils";

const createCypressJobs = (dbSetup: string) => {
    const ucFirstDbSetup = dbSetup.charAt(0).toUpperCase() + dbSetup.slice(1);

    const jobNames = {
        init: `e2eTests${ucFirstDbSetup}-init`,
        projectSetup: `e2eTests${ucFirstDbSetup}-setup`,
        cypressTests: `e2eTests${ucFirstDbSetup}-cypress`
    };

    const initJob: NormalJob = createJob({
        name: `E2E (${dbSetup.toUpperCase()}) - Init`,
        outputs: {
            day: "${{ steps.get-day.outputs.day }}",
            ts: "${{ steps.get-timestamp.outputs.ts }}",
            "cypress-folders": "${{ steps.list-cypress-folders.outputs.cypress-folders }}"
        },
        steps: [
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
                name: "List Cypress tests folders",
                id: "list-cypress-folders",
                run: 'echo "cypress-folders=$(node scripts/listCypressTestsFolders.js)" >> $GITHUB_OUTPUT'
            }
        ]
    });

    const env: Record<string, string> = {
        CYPRESS_MAILOSAUR_API_KEY: "${{ secrets.CYPRESS_MAILOSAUR_API_KEY }}",
        PULUMI_CONFIG_PASSPHRASE: "${{ secrets.PULUMI_CONFIG_PASSPHRASE }}",
        PULUMI_SECRETS_PROVIDER: "${{ secrets.PULUMI_SECRETS_PROVIDER }}",
        WEBINY_PULUMI_BACKEND: `$\{{ secrets.WEBINY_PULUMI_BACKEND }}$\{{ needs.${jobNames.init}.outputs.ts }}_ddb`,
        YARN_ENABLE_IMMUTABLE_INSTALLS: "false"
    };

    if (dbSetup === "ddb-es") {
        env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_ELASTIC_SEARCH_DOMAIN_NAME }}";
        env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.ELASTIC_SEARCH_ENDPOINT }}";
        env["ELASTIC_SEARCH_INDEX_PREFIX"] = `$\{{ needs.${jobNames.init}.outputs.ts }}_`;
    } else if (dbSetup === "ddb-os") {
        // We still use the same environment variables as for "ddb-es" setup, it's
        // just that the values are read from different secrets.
        env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_OPEN_SEARCH_DOMAIN_NAME }}";
        env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.OPEN_SEARCH_ENDPOINT }}";
        env["ELASTIC_SEARCH_INDEX_PREFIX"] = `$\{{ needs.${jobNames.init}.outputs.ts }}_`;
    }

    const projectSetupJob: NormalJob = createJob({
        needs: jobNames.init,
        name: `E2E (${dbSetup.toUpperCase()}) - Project setup`,
        outputs: {
            "cypress-config": "${{ steps.save-cypress-config.outputs.cypress-config }}"
        },
        environment: "next",
        env,
        checkout: {
            "fetch-depth": 0,
            path: "dev"
        },
        awsAuth: true,
        steps: [
            {
                uses: "actions/cache@v4",
                id: "yarn-cache",
                with: {
                    path: "dev/.yarn/cache",
                    key: "yarn-${{ runner.os }}-${{ hashFiles('dev/**/yarn.lock') }}"
                }
            },
            {
                uses: "actions/cache@v4",
                id: "cached-packages",
                with: {
                    path: "dev/.webiny/cached-packages",
                    key: `$\{{ runner.os }}-$\{{ needs.${jobNames.init}.outputs.day }}-$\{{ secrets.RANDOM_CACHE_KEY_SUFFIX }}`
                }
            },
            {
                name: "Install dependencies",
                "working-directory": "dev",
                run: "yarn --immutable"
            },
            {
                name: "Build packages",
                "working-directory": "dev",
                run: "yarn build:quick"
            },
            {
                uses: "actions/cache@v4",
                id: "packages-cache",
                with: {
                    path: "dev/.webiny/cached-packages",
                    key: `packages-cache-$\{{ needs.${jobNames.init}.outputs.ts }}`
                }
            },
            ...createSetupVerdaccioSteps({ workingDirectory: "dev" }),
            {
                name: 'Create ".npmrc" file in the project root, with a dummy auth token',
                "working-directory": "dev",
                run: "echo '//localhost:4873/:_authToken=\"dummy-auth-token\"' > .npmrc"
            },
            {
                name: "Version and publish to Verdaccio",
                "working-directory": "dev",
                run: "yarn release --type=verdaccio"
            },
            {
                name: "Create verdaccio-files artifact",
                uses: "actions/upload-artifact@v4",
                with: {
                    name: `verdaccio-files-${dbSetup}`,
                    "retention-days": 1,
                    path: "dev/.verdaccio/\ndev/.verdaccio.yaml\n"
                }
            },
            {
                name: "Create directory",
                run: "mkdir xyz"
            },
            {
                name: "Disable Webiny telemetry",
                run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
            },
            {
                name: "Create a new Webiny project",
                "working-directory": "xyz",
                run: `npx create-webiny-project@local-npm test-project --tag local-npm --no-interactive --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}' --template-options '{"region":"$\{{ env.AWS_REGION }}","storageOperations":"${dbSetup}"}'
`
            },
            {
                name: "Print CLI version",
                "working-directory": "xyz/test-project",
                run: "yarn webiny --version"
            },
            {
                name: "Create project-files artifact",
                uses: "actions/upload-artifact@v4",
                with: {
                    name: `project-files-${dbSetup}`,
                    "retention-days": 1,
                    path: "xyz/test-project/\n!xyz/test-project/node_modules/**/*\n!xyz/test-project/**/node_modules/**/*\n!xyz/test-project/.yarn/cache/**/*\n"
                }
            },
            ...createDeployWebinySteps({ workingDirectory: "xyz/test-project" }),
            {
                name: "Create Cypress config",
                "working-directory": "dev",
                run: "yarn setup-cypress --projectFolder ../xyz/test-project"
            },
            {
                name: "Save Cypress config",
                id: "save-cypress-config",
                "working-directory": "dev",
                run: "echo \"cypress-config=$(cat cypress-tests/cypress.config.ts | tr -d '\\t\\n\\r')\" >> $GITHUB_OUTPUT"
            },
            {
                name: "Cypress - run installation wizard test",
                "working-directory": "dev/cypress-tests",
                run: 'yarn cypress run --browser chrome --spec "cypress/e2e/adminInstallation/**/*.cy.js"'
            }
        ]
    });

    const cypressTestsJob = createJob({
        name: `$\{{ matrix.cypress-folder }} (${dbSetup}, $\{{ matrix.os }}, Node v$\{{ matrix.node }})`,
        needs: [jobNames.init, jobNames.projectSetup],
        strategy: {
            "fail-fast": false,
            matrix: {
                os: ["ubuntu-latest"],
                node: [NODE_VERSION],
                "cypress-folder": `$\{{ fromJson(needs.${jobNames.init}.outputs.cypress-folders) }}`
            }
        },
        environment: "next",
        env,
        checkout: { path: "dev" },
        steps: [
            {
                uses: "actions/cache@v4",
                with: {
                    path: "dev/.webiny/cached-packages",
                    key: `packages-cache-$\{{ needs.${jobNames.init}.outputs.ts }}`
                }
            },
            {
                uses: "actions/cache@v4",
                with: {
                    path: "dev/.yarn/cache",
                    key: "yarn-${{ runner.os }}-${{ hashFiles('dev/**/yarn.lock') }}"
                }
            },
            {
                name: "Install dependencies",
                "working-directory": "dev",
                run: "yarn --immutable"
            },
            {
                name: "Build packages",
                "working-directory": "dev",
                run: "yarn build:quick"
            },
            {
                name: "Set up Cypress config",
                "working-directory": "dev",
                run: `echo '$\{{ needs.${jobNames.projectSetup}.outputs.cypress-config }}' > cypress-tests/cypress.config.ts`
            },
            {
                name: 'Cypress - run "${{ matrix.cypress-folder }}" tests',
                "working-directory": "dev/cypress-tests",
                "timeout-minutes": 40,
                run: 'yarn cypress run --browser chrome --spec "${{ matrix.cypress-folder }}"'
            }
        ]
    });

    return {
        [jobNames.init]: initJob,
        [jobNames.projectSetup]: projectSetupJob,
        [jobNames.cypressTests]: cypressTestsJob
    };
};

const createPushWorkflow = (branchName: string) => {
    const ucFirstBranchName = branchName.charAt(0).toUpperCase() + branchName.slice(1);

    const workflow = createWorkflow({
        name: `${ucFirstBranchName} Branch - Push`,
        on: { push: { branches: [branchName] } },
        jobs: {
            validateWorkflows: createValidateWorkflowsJob(),
            init: createJob({
                name: "Init",
                outputs: {
                    day: "${{ steps.get-day.outputs.day }}",
                    ts: "${{ steps.get-timestamp.outputs.ts }}"
                },
                steps: [
                    {
                        name: "Get day of the month",
                        id: "get-day",
                        run: 'echo "day=$(node --eval "console.log(new Date().getDate())")" >> $GITHUB_OUTPUT'
                    },
                    {
                        name: "Get timestamp",
                        id: "get-timestamp",
                        run: 'echo "ts=$(node --eval "console.log(new Date().getTime())")" >> $GITHUB_OUTPUT'
                    }
                ]
            }),
            build: createJob({
                name: "Build",
                needs: "init",
                "runs-on": "blacksmith-4vcpu-ubuntu-2204",
                steps: [
                    {
                        uses: "actions/cache@v4",
                        id: "yarn-cache",
                        with: {
                            path: ".yarn/cache",
                            key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
                        }
                    },
                    {
                        uses: "actions/cache@v4",
                        id: "global-daily-packages-cache",
                        with: {
                            path: ".webiny/cached-packages",
                            key: "${{ runner.os }}-${{ needs.init.outputs.day }}-${{ secrets.RANDOM_CACHE_KEY_SUFFIX }}"
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
                        uses: "actions/cache@v4",
                        id: "packages-cache",
                        with: {
                            path: ".webiny/cached-packages",
                            key: "packages-cache-${{ needs.init.outputs.ts }}"
                        }
                    }
                ]
            }),
            codeAnalysis: createJob({
                name: "Static code analysis",
                needs: ["init", "build"],
                steps: [
                    {
                        uses: "actions/cache@v4",
                        with: {
                            path: ".yarn/cache",
                            key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
                        }
                    },
                    {
                        uses: "actions/cache@v4",
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
                "runs-on": "blacksmith-4vcpu-ubuntu-2204",
                steps: [
                    {
                        uses: "actions/cache@v4",
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
            ...createCypressJobs("ddb"),
            ...createCypressJobs("ddb-es"),
            ...createCypressJobs("ddb-os")
        }
    });

    if (branchName === "next") {
        const jestJobsNames = Object.keys(workflow.jobs).filter(name => name.startsWith("jest"));
        const e2eJobsNames = Object.keys(workflow.jobs).filter(name => name.endsWith("cypress"));

        workflow.jobs.npmReleaseUnstable = createJob({
            needs: ["init", "codeAnalysis", ...jestJobsNames, ...e2eJobsNames],
            name: 'NPM release ("unstable" tag)',
            environment: "release",
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}"
            },
            checkout: { "fetch-depth": 0 },
            steps: [
                {
                    uses: "actions/cache@v4",
                    with: {
                        path: ".yarn/cache",
                        key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
                    }
                },
                {
                    uses: "actions/cache@v4",
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
                    run: "yarn build"
                },
                {
                    name: 'Create ".npmrc" file in the project root',
                    run: 'echo "//registry.npmjs.org/:_authToken=\\${NPM_TOKEN}" > .npmrc'
                },
                {
                    name: "Set git info",
                    run: 'git config --global user.email "webiny-bot@webiny.com"\ngit config --global user.name "webiny-bot"\n'
                },
                {
                    name: "Version and publish to NPM",
                    run: "yarn release --type=unstable"
                }
            ]
        });
    }

    return workflow;
};

export const pushDev = createPushWorkflow("dev");
export const pushNext = createPushWorkflow("next");
