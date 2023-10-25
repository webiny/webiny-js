import { createWorkflow, NormalJob } from "github-actions-wac";
import { createSetupVerdaccioSteps, createDeployWebinySteps } from "./steps";
import { NODE_VERSION } from "./utils";

// Let's assign some of the common steps into a standalone const.
const createSetupSteps = ({ workingDirectory = "" } = {}) =>
    [
        {
            uses: "actions/setup-node@v3",
            with: {
                "node-version": NODE_VERSION
            }
        },
        { uses: "actions/checkout@v3", with: { path: workingDirectory } },
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

const createJobs = (dbSetup: string) => {
    const jobNames = {
        init: `e2e-wby-cms-${dbSetup}-init`,
        projectSetup: `e2e-wby-cms-${dbSetup}-project-setup`,
        cypressTests: `e2e-wby-cms-${dbSetup}-cypress-tests`
    };

    const initJob: NormalJob = {
        needs: "checkComment",
        name: `E2E (${dbSetup.toUpperCase()}) - Init`,
        "runs-on": "ubuntu-latest",
        outputs: {
            day: "${{ steps.get-day.outputs.day }}",
            ts: "${{ steps.get-timestamp.outputs.ts }}",
            "cypress-folders": "${{ steps.list-cypress-folders.outputs.cypress-folders }}"
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
                name: "List Cypress tests folders",
                id: "list-cypress-folders",
                run: 'echo "cypress-folders=$(node scripts/listCypressTestsFolders.js)" >> $GITHUB_OUTPUT'
            }
        ]
    };

    const env: Record<string, string> = {
        AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}",
        AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
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

    const projectSetupJob: NormalJob = {
        name: `E2E (${dbSetup.toUpperCase()}) - Project setup`,
        needs: jobNames.init,
        "runs-on": "ubuntu-latest",
        outputs: {
            "cypress-config": "${{ steps.save-cypress-config.outputs.cypress-config }}"
        },
        environment: "next",
        env,
        steps: [
            ...createSetupSteps({ workingDirectory: "dev" }),
            {
                uses: "actions/cache@v3",
                id: "yarn-cache",
                with: {
                    path: "dev/.yarn/cache",
                    key: "yarn-${{ runner.os }}-${{ hashFiles('dev/**/yarn.lock') }}"
                }
            },
            {
                uses: "actions/cache@v3",
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
                uses: "actions/cache@v3",
                id: "packages-cache",
                with: {
                    path: "dev/.webiny/cached-packages",
                    key: `packages-cache-$\{{ needs.${jobNames.init}.outputs.ts }}`
                }
            },
            ...createSetupVerdaccioSteps(),
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
                uses: "actions/upload-artifact@v3",
                with: {
                    name: "project-files",
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
    };

    const cypressTestsJob = {
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
        "runs-on": "ubuntu-latest",
        environment: "next",
        env,
        steps: [
            ...createSetupSteps({ workingDirectory: "dev" }),
            {
                uses: "actions/cache@v3",
                with: {
                    path: "dev/.webiny/cached-packages",
                    key: `packages-cache-$\{{ needs.${jobNames.init}.outputs.ts }}`
                }
            },
            {
                uses: "actions/cache@v3",
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
    };

    return {
        [jobNames.init]: initJob,
        [jobNames.projectSetup]: projectSetupJob,
        [jobNames.cypressTests]: cypressTestsJob
    };
};

// Create "Pull requests" workflow.
export const pullRequestsCommandCypress = createWorkflow({
    name: "Pull Requests Command - Cypress",
    on: "issue_comment",
    env: {
        NODE_OPTIONS: "--max_old_space_size=4096",
        AWS_REGION: "eu-central-1"
    },
    jobs: {
        checkComment: {
            name: `Check comment for /cypress`,
            "runs-on": "ubuntu-latest",
            if: "${{ github.event.issue.pull_request }}",
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
        },
        ...createJobs("ddb"),
        ...createJobs("ddb-es"),
        ...createJobs("ddb-os")
    }
});
