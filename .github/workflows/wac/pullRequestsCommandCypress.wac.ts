import { createWorkflow, NormalJob } from "github-actions-wac";
import { createSetupVerdaccioSteps, createDeployWebinySteps } from "./steps";
import { NODE_OPTIONS, NODE_VERSION } from "./utils";
import { createJob, createValidateWorkflowsJob } from "./jobs";

const DIR_PR = "checked-out-pr";
const DIR_TEST_PROJECT = "new-webiny-project";

const createCheckoutPrSteps = ({ workingDirectory = "" } = {}) =>
    [
        { name: "Install Hub Utility", run: "sudo apt-get install -y hub" },
        {
            name: "Checkout Pull Request",
            "working-directory": workingDirectory,
            run: "hub pr checkout ${{ github.event.issue.number }}",
            env: {
                GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}"
            }
        }
    ] as NonNullable<NormalJob["steps"]>;

const yarnCacheSteps: NormalJob["steps"] = [
    {
        uses: "actions/cache@v4",
        with: {
            path: DIR_PR + "/.yarn/cache",
            key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
        }
    }
];

const createJobs = (dbSetup: string) => {
    const jobNames = {
        constants: `e2e-wby-cms-${dbSetup}-constants`,
        projectSetup: `e2e-wby-cms-${dbSetup}-project-setup`,
        cypressTests: `e2e-wby-cms-${dbSetup}-cypress-tests`
    };

    const constantsJob: NormalJob = createJob({
        needs: "checkComment",
        name: `E2E (${dbSetup.toUpperCase()}) - Constants`,
        outputs: {
            "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}",
            "run-cache-key": "${{ steps.run-cache-key.outputs.run-cache-key }}",
            "cypress-folders": "${{ steps.list-cypress-folders.outputs.cypress-folders }}",
            "pulumi-backend-url": "${{ steps.pulumi-backend-url.outputs.pulumi-backend-url }}"
        },
        steps: [
            ...createCheckoutPrSteps(),
            {
                name: "Create global cache key",
                id: "global-cache-key",
                run: 'echo "global-cache-key=$(hub pr show ${{ github.event.issue.number }} -f %B)-${{ runner.os }}-$(/bin/date -u "+%m%d")-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT',
                env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" }
            },
            {
                name: "Create workflow run cache key",
                id: "run-cache-key",
                run: 'echo "run-cache-key=${{ github.run_id }}-${{ github.run_attempt }}-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT'
            },
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

    const buildGlobalCacheSteps = [
        {
            uses: "actions/cache@v4",
            with: {
                path: DIR_PR + "/.webiny/cached-packages",
                key: `\${{ needs.${jobNames.constants}.outputs.global-cache-key }}`
            }
        }
    ];

    const buildRunCacheSteps = [
        {
            uses: "actions/cache@v4",
            with: {
                path: DIR_PR + "/.webiny/cached-packages",
                key: `\${{ needs.${jobNames.constants}.outputs.run-cache-key }}`
            }
        }
    ];

    const env: Record<string, string> = {
        CYPRESS_MAILOSAUR_API_KEY: "${{ secrets.CYPRESS_MAILOSAUR_API_KEY }}",
        PULUMI_CONFIG_PASSPHRASE: "${{ secrets.PULUMI_CONFIG_PASSPHRASE }}",
        PULUMI_SECRETS_PROVIDER: "${{ secrets.PULUMI_SECRETS_PROVIDER }}",
        WEBINY_PULUMI_BACKEND: `\${{ needs.${jobNames.constants}.outputs.pulumi-backend-url }}`
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
        needs: jobNames.constants,
        name: `E2E (${dbSetup.toUpperCase()}) - Project setup`,
        outputs: {
            "cypress-config": "${{ steps.save-cypress-config.outputs.cypress-config }}"
        },
        environment: "next",
        env,
        checkout: { path: DIR_PR },
        awsAuth: true,
        steps: [
            ...createCheckoutPrSteps({ workingDirectory: DIR_PR }),
            ...yarnCacheSteps,
            ...buildGlobalCacheSteps,
            {
                name: "Install dependencies",
                "working-directory": DIR_PR,
                run: "yarn --immutable"
            },
            {
                name: "Build packages",
                "working-directory": DIR_PR,
                run: "yarn build:quick"
            },
            ...buildRunCacheSteps,
            ...createSetupVerdaccioSteps({ workingDirectory: DIR_PR }),
            {
                name: 'Create ".npmrc" file in the project root, with a dummy auth token',
                "working-directory": DIR_PR,
                run: "echo '//localhost:4873/:_authToken=\"dummy-auth-token\"' > .npmrc"
            },
            {
                name: "Version and publish to Verdaccio",
                "working-directory": DIR_PR,
                run: "yarn release --type=verdaccio"
            },
            {
                name: "Create verdaccio-files artifact",
                uses: "actions/upload-artifact@v4",
                with: {
                    name: `verdaccio-files-${dbSetup}`,
                    "retention-days": 1,
                    path: [DIR_PR + "/.verdaccio/", DIR_PR + "/.verdaccio.yaml\n"].join("\n")
                }
            },
            {
                name: "Disable Webiny telemetry",
                run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
            },
            {
                name: "Create a new Webiny project",
                run: `npx create-webiny-project@local-npm ${DIR_TEST_PROJECT} --tag local-npm --no-interactive --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}' --template-options '{"region":"\${{ env.AWS_REGION }}","storageOperations":"${dbSetup}"}'
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
            {
                name: "Create Cypress config",
                "working-directory": DIR_PR,
                run: `yarn setup-cypress --projectFolder ../${DIR_TEST_PROJECT}`
            },
            {
                name: "Save Cypress config",
                id: "save-cypress-config",
                "working-directory": DIR_PR,
                run: "echo \"cypress-config=$(cat cypress-tests/cypress.config.ts | tr -d '\\t\\n\\r')\" >> $GITHUB_OUTPUT"
            },
            {
                name: "Cypress - run installation wizard test",
                "working-directory": DIR_PR,
                run: 'yarn cy:run --browser chrome --spec "cypress/e2e/adminInstallation/**/*.cy.js"'
            }
        ]
    });

    const cypressTestsJob = createJob({
        name: `\${{ matrix.cypress-folder }} (${dbSetup}, \${{ matrix.os }}, Node v\${{ matrix.node }})`,
        needs: [jobNames.constants, jobNames.projectSetup],
        strategy: {
            "fail-fast": false,
            matrix: {
                os: ["ubuntu-latest"],
                node: [NODE_VERSION],
                "cypress-folder": `\${{ fromJson(needs.${jobNames.constants}.outputs.cypress-folders) }}`
            }
        },
        environment: "next",
        env,
        checkout: { path: DIR_PR },
        steps: [
            ...createCheckoutPrSteps({ workingDirectory: DIR_PR }),
            ...yarnCacheSteps,
            ...buildRunCacheSteps,
            {
                name: "Install dependencies",
                "working-directory": DIR_PR,
                run: "yarn --immutable"
            },
            {
                name: "Build packages",
                "working-directory": DIR_PR,
                run: "yarn build:quick"
            },
            {
                name: "Set up Cypress config",
                "working-directory": DIR_PR,
                run: `echo '\${{ needs.${jobNames.projectSetup}.outputs.cypress-config }}' > cypress-tests/cypress.config.ts`
            },
            {
                name: 'Cypress - run "${{ matrix.cypress-folder }}" tests',
                "timeout-minutes": 40,
                "working-directory": DIR_PR,
                run: 'yarn cy:run --browser chrome --spec "${{ matrix.cypress-folder }}"'
            }
        ]
    });

    return {
        [jobNames.constants]: constantsJob,
        [jobNames.projectSetup]: projectSetupJob,
        [jobNames.cypressTests]: cypressTestsJob
    };
};

export const pullRequestsCommandCypress = createWorkflow({
    name: "Pull Requests Command - Cypress",
    on: "issue_comment",
    env: {
        NODE_OPTIONS,
        AWS_REGION: "eu-central-1"
    },
    jobs: {
        validateWorkflows: createValidateWorkflowsJob(),
        checkComment: createJob({
            name: `Check comment for /cypress`,
            if: "${{ github.event.issue.pull_request }}",
            checkout: false,
            steps: [
                {
                    name: "Check for Command",
                    id: "command",
                    uses: "xt0rted/slash-command-action@v2",
                    with: {
                        "repo-token": "${{ secrets.GITHUB_TOKEN }}",
                        command: "cypress",
                        reaction: "true",
                        "reaction-type": "eyes",
                        "allow-edits": "false",
                        "permission-level": "write"
                    }
                },
                {
                    name: "Create comment",
                    uses: "peter-evans/create-or-update-comment@v2",
                    with: {
                        "issue-number": "${{ github.event.issue.number }}",
                        body: "Cypress E2E tests have been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:"
                    }
                }
            ]
        }),
        ...createJobs("ddb"),
        ...createJobs("ddb-es"),
        ...createJobs("ddb-os")
    }
});
