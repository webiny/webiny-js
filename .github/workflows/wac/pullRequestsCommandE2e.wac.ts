import { NormalJob } from "github-actions-wac";
import {
    createDeployWebinySteps,
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createRunBuildArtifactDownloadSteps,
    createRunBuildArtifactUploadSteps,
    createSetupVerdaccioSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";
import { ACTION, AWS_REGION, BUILD_PACKAGES_RUNNER, NODE_OPTIONS } from "./utils/index.js";
import { createJob, createSlashCommandWorkflow } from "./jobs/index.js";

// Will print "next" or "dev". Important for caching (via actions/cache).
const DIR_WEBINY_JS = "${{ needs.baseBranch.outputs.base-branch }}";
const DIR_TEST_PROJECT = "new-webiny-project";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const runBuildCacheUploadSteps = createRunBuildArtifactUploadSteps({
    workingDirectory: DIR_WEBINY_JS
});
const runBuildCacheDownloadSteps = createRunBuildArtifactDownloadSteps({
    workingDirectory: DIR_WEBINY_JS
});

const createCheckoutPrSteps = () =>
    [
        {
            name: "Checkout Pull Request",
            "working-directory": DIR_WEBINY_JS,
            // Detach onto the SHA `baseBranch` resolved, so every job in this run builds and
            // tests the same commit even if the PR is pushed to mid-run.
            run: [
                "gh pr checkout ${{ github.event.issue.number }}",
                "git checkout --detach ${{ needs.baseBranch.outputs.pr-sha }}"
            ].join("\n"),
            env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" }
        }
    ] as NonNullable<NormalJob["steps"]>;

const createCypressJobs = (dbSetup: string) => {
    const jobNames = {
        constants: `e2e-wby-cms-${dbSetup}-constants`,
        projectSetup: `e2e-wby-cms-${dbSetup}-project-setup`,
        cypressTests: `e2e-wby-cms-${dbSetup}-cypress-tests`
    };

    const dbDisplayName = dbSetup === "ddb-os" ? "DDB+OS" : "DDB";

    const constantsJob: NormalJob = createJob({
        needs: ["baseBranch", "constants", "build"],
        name: `Constants - ${dbSetup.toUpperCase()}`,
        outputs: {
            "cypress-folders": "${{ steps.list-cypress-folders.outputs.cypress-folders }}",
            "pulumi-backend-url": "${{ steps.pulumi-backend-url.outputs.pulumi-backend-url }}"
        },
        checkout: { path: DIR_WEBINY_JS },
        steps: [
            ...createCheckoutPrSteps(),
            {
                name: "List Cypress tests folders",
                id: "list-cypress-folders",
                run: 'echo "cypress-folders=$(node scripts/listCypressTestsFolders.js)" >> $GITHUB_OUTPUT',
                "working-directory": DIR_WEBINY_JS
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
        WEBINY_INFRA_API_MAX_BUNDLE_SIZE: "${{ vars.WEBINY_INFRA_API_MAX_BUNDLE_SIZE }}"
    };

    if (dbSetup === "ddb-os") {
        env["AWS_OPENSEARCH_DOMAIN_NAME"] = "${{ secrets.OPENSEARCH_DOMAIN_NAME }}";
        env["OPENSEARCH_ENDPOINT"] = "${{ secrets.OPENSEARCH_ENDPOINT }}";
        env["OPENSEARCH_USERNAME"] = "${{ secrets.OPENSEARCH_USERNAME }}";
        env["OPENSEARCH_PASSWORD"] = "${{ secrets.OPENSEARCH_PASSWORD }}";
        env["OPENSEARCH_INDEX_PREFIX"] = "${{ github.run_id }}_";
    }

    const projectSetupJob: NormalJob = createJob({
        needs: ["baseBranch", "constants", jobNames.constants, "checkComment"],
        name: `E2E (${dbSetup.toUpperCase()}) - Project setup`,
        outputs: {
            "cypress-config": "${{ steps.save-cypress-config.outputs.cypress-config }}"
        },
        environment: "next",
        env,
        awsAuth: true,
        checkout: { path: DIR_WEBINY_JS },
        steps: [
            ...createCheckoutPrSteps(),
            ...yarnCacheSteps,
            ...runBuildCacheDownloadSteps,
            ...installBuildSteps,
            ...createSetupVerdaccioSteps({ workingDirectory: DIR_WEBINY_JS }),
            {
                name: 'Create ".npmrc" file in the project root, with a dummy auth token',
                "working-directory": DIR_WEBINY_JS,
                run: "echo '//localhost:4873/:_authToken=\"dummy-auth-token\"' > .npmrc"
            },
            {
                name: "Version and publish to Verdaccio",
                "working-directory": DIR_WEBINY_JS,
                run: "yarn release --type=verdaccio"
            },
            {
                name: "Create verdaccio-files artifact",
                uses: ACTION.uploadArtifactV6,
                with: {
                    name: `verdaccio-files-${dbSetup}`,
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
                run: `npx create-webiny-project@local-npm ${DIR_TEST_PROJECT} --tag local-npm --no-interactive --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}' --template-options '{"region":"\${{ env.AWS_REGION }}","storageOps":"${dbSetup}"}'
`
            },
            ...(dbSetup === "ddb-os"
                ? [
                      {
                          name: "Configure OpenSearch domain name and index prefix in webiny.config.tsx",
                          "working-directory": DIR_TEST_PROJECT,
                          run: `sed -i 's|<Infra.OpenSearch enabled={true} />|<Infra.OpenSearch enabled={true} domainName={process.env.AWS_OPENSEARCH_DOMAIN_NAME \\|\\| "webiny-e2e-os"} indexPrefix={process.env.OPENSEARCH_INDEX_PREFIX \\|\\| ""} endpoint={process.env.OPENSEARCH_ENDPOINT} username={process.env.OPENSEARCH_USERNAME} password={process.env.OPENSEARCH_PASSWORD} />|g' webiny.config.tsx`
                      }
                  ]
                : []),
            {
                name: "Print CLI version",
                "working-directory": DIR_TEST_PROJECT,
                run: "yarn webiny --version"
            },
            {
                name: "Create project-files artifact",
                uses: ACTION.uploadArtifactV6,
                with: {
                    name: `project-files-${dbSetup}`,
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
                name: "API bundle size limit",
                run: 'echo "API bundle size limit: ${WEBINY_INFRA_API_MAX_BUNDLE_SIZE:-6291456} bytes"'
            },
            ...createDeployWebinySteps({ workingDirectory: DIR_TEST_PROJECT }),
            ...(dbSetup === "ddb-os"
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
            {
                name: "Update PR comment with admin URL",
                env: {
                    GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}",
                    ADMIN_URL: `\${{ steps.admin-url.outputs.admin-url }}`,
                    COMMENT_ID: `\${{ needs.checkComment.outputs.comment-id }}`
                },
                run: [
                    `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID --jq '.body' > /tmp/comment.txt`,
                    `sed -i "s@| ${dbDisplayName} | 🔄 Deploying... | - |@| ${dbDisplayName} | ✅ Ready | $ADMIN_URL |@" /tmp/comment.txt`,
                    `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID -X PATCH --field body=@/tmp/comment.txt`
                ].join("\n")
            },
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
                        name: "Install Cypress binary",
                        run: "cd cypress-tests && yarn cypress install"
                    },
                    {
                        name: "Cypress - run installation wizard test",
                        run: 'yarn cy:run --browser chrome --spec "cypress/e2e/adminInstallation/**/*.cy.js"'
                    }
                ],
                {
                    "working-directory": DIR_WEBINY_JS
                }
            )
        ]
    });

    return {
        [jobNames.constants]: constantsJob,
        [jobNames.projectSetup]: projectSetupJob
    };
};

// Self-hosted ("server" hosting type) E2E, SQLite variant.
//
// Structurally different from the AWS jobs above, in one way that matters: a self-hosted project
// is not deployed anywhere, it runs ON THE RUNNER. The API process and the Admin static server
// only exist for the lifetime of the job that starts them, so scaffold / build / start / test all
// have to live in a SINGLE job - there is no deployed URL to hand to a separate Cypress job.
//
// Consequences: no `awsAuth`, no Pulumi backend, no `environment: next` secrets, and it runs on a
// GitHub-hosted runner. That makes it far cheaper than the DDB / DDB+OS jobs.
//
// Ports match the template defaults (WEBINY_API_PORT / WEBINY_ADMIN_PORT), which is also what
// `setup-cypress --localhost` assumes.
const SERVER_API_PORT = 3002;
const SERVER_ADMIN_PORT = 3001;
const SERVER_API_URL = `http://localhost:${SERVER_API_PORT}`;
const SERVER_ADMIN_URL = `http://localhost:${SERVER_ADMIN_PORT}`;
const DIR_SERVER_PROJECT = "new-webiny-project-server";
const SERVER_BUILD_DIR = `${DIR_SERVER_PROJECT}/.webiny/workspace/apps`;

const createServerE2eJobs = () => {
    return {
        "e2e-server-sqlite": createJob({
            needs: ["baseBranch", "constants", "build", "checkComment"],
            name: "E2E (Server) - SQLite",
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...createCheckoutPrSteps(),
                ...yarnCacheSteps,
                ...runBuildCacheDownloadSteps,
                ...installBuildSteps,
                ...createSetupVerdaccioSteps({ workingDirectory: DIR_WEBINY_JS }),
                {
                    name: 'Create ".npmrc" file in the project root, with a dummy auth token',
                    "working-directory": DIR_WEBINY_JS,
                    run: "echo '//localhost:4873/:_authToken=\"dummy-auth-token\"' > .npmrc"
                },
                {
                    name: "Version and publish to Verdaccio",
                    "working-directory": DIR_WEBINY_JS,
                    run: "yarn release --type=verdaccio"
                },
                {
                    name: "Disable Webiny telemetry",
                    run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
                },
                {
                    // `storageOps: "sqlite"` is already the default for the server hosting type;
                    // passed explicitly so this job says what it tests.
                    name: "Create a new self-hosted Webiny project",
                    run: `npx create-webiny-project@local-npm ${DIR_SERVER_PROJECT} --tag local-npm --no-interactive --hosting-type server --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}' --template-options '{"storageOps":"sqlite"}'`
                },
                {
                    name: "Print CLI version",
                    "working-directory": DIR_SERVER_PROJECT,
                    run: "yarn webiny --version"
                },
                {
                    // The Admin bundle bakes its API origin at build time, so WEBINY_API_URL has to
                    // be set here and match where the API is actually started below.
                    name: "Build API and Admin",
                    "working-directory": DIR_SERVER_PROJECT,
                    env: {
                        WEBINY_HOSTING_TYPE: "server",
                        WEBINY_API_URL: SERVER_API_URL
                    },
                    run: "yarn webiny build api && yarn webiny build admin"
                },
                {
                    // Backgrounded so the job can continue; the process lives for the rest of the
                    // job. Logs go to a file so the failure handler below can surface them.
                    name: "Start API",
                    env: { PORT: `${SERVER_API_PORT}` },
                    run: [
                        `cd ${SERVER_BUILD_DIR}/api/graphql/build`,
                        "nohup node start.mjs > /tmp/webiny-api.log 2>&1 &",
                        'echo "API starting on port ' + SERVER_API_PORT + '"'
                    ].join("\n")
                },
                {
                    // `serve -s` gives the SPA fallback the Admin app needs (a hard refresh on a
                    // client-side route must not 404) - the same thing nginx-spa.conf does for the
                    // documented Docker setup. `serve` itself is not published to Verdaccio, but
                    // .verdaccio.yaml proxies `**` to the npmjs uplink, so npx resolves it even
                    // though the registry is pointed at localhost:4873 at this point.
                    name: "Serve Admin",
                    run: [
                        `nohup npx --yes serve -s ${SERVER_BUILD_DIR}/admin/build -l ${SERVER_ADMIN_PORT} > /tmp/webiny-admin.log 2>&1 &`,
                        'echo "Admin starting on port ' + SERVER_ADMIN_PORT + '"'
                    ].join("\n")
                },
                {
                    name: "Wait for API and Admin",
                    run: [
                        "set -euo pipefail",
                        "",
                        "wait_for_port() {",
                        "  for _ in $(seq 1 90); do",
                        '    if (echo > /dev/tcp/127.0.0.1/"$1") >/dev/null 2>&1; then',
                        '      echo "port $1 is accepting connections"',
                        "      return 0",
                        "    fi",
                        "    sleep 2",
                        "  done",
                        '  echo "::error::Timed out waiting for port $1."',
                        "  return 1",
                        "}",
                        "",
                        `wait_for_port ${SERVER_API_PORT}`,
                        `wait_for_port ${SERVER_ADMIN_PORT}`,
                        "",
                        "# A listening socket is not the same as a working GraphQL endpoint.",
                        `curl -fsS -X POST ${SERVER_API_URL}/graphql -H 'content-type: application/json' \\`,
                        `  -d '{"query":"{__typename}"}' > /dev/null`,
                        'echo "GraphQL API responded."'
                    ].join("\n")
                },
                {
                    name: "Create Cypress config",
                    "working-directory": DIR_WEBINY_JS,
                    run: `yarn setup-cypress --apiUrl ${SERVER_API_URL} --adminUrl ${SERVER_ADMIN_URL}`
                },
                {
                    name: "Install Cypress binary",
                    "working-directory": DIR_WEBINY_JS,
                    run: "cd cypress-tests && yarn cypress install"
                },
                {
                    // Only the installation wizard for now. It is pure UI (no cy.login), so it does
                    // not need the Cognito-based auth helper that the other specs use - porting that
                    // to the self-hosted identity provider comes next.
                    name: "Cypress - run installation wizard test",
                    "working-directory": DIR_WEBINY_JS,
                    run: 'yarn cy:run --browser chrome --spec "cypress/e2e/adminInstallation/**/*.cy.js"'
                },
                {
                    name: "Print server logs",
                    if: "failure()",
                    run: [
                        'echo "::group::API log"; cat /tmp/webiny-api.log || true; echo "::endgroup::"',
                        'echo "::group::Admin log"; cat /tmp/webiny-admin.log || true; echo "::endgroup::"'
                    ].join("\n")
                },
                {
                    name: "Upload Cypress screenshots",
                    if: "failure()",
                    uses: ACTION.uploadArtifactV6,
                    with: {
                        name: "cypress-screenshots-server-sqlite",
                        "retention-days": 1,
                        "if-no-files-found": "ignore",
                        path: `${DIR_WEBINY_JS}/cypress-tests/cypress/screenshots`
                    }
                }
            ]
        })
    };
};

export const pullRequestsCommandE2e = createSlashCommandWorkflow({
    command: "e2e",
    name: "Pull Requests Command - E2E",
    comment:
        "Cypress E2E tests have been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:\n\n| Database | Status | Admin URL |\n| --- | --- | --- |\n| DDB | 🔄 Deploying... | - |\n| DDB+OS | 🔄 Deploying... | - |",
    captureCommentId: true,
    workflow: {
        env: {
            NODE_OPTIONS,
            AWS_REGION
        }
    },
    jobs: {
        baseBranch: createJob({
            needs: "checkComment",
            name: "Get base branch",
            outputs: {
                "base-branch": "${{ steps.base-branch.outputs.base-branch }}",
                "pr-sha": "${{ steps.pr-sha.outputs.pr-sha }}"
            },
            steps: [
                {
                    name: "Get base branch",
                    id: "base-branch",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: 'echo "base-branch=$(gh pr view ${{ github.event.issue.number }} --json baseRefName -q .baseRefName)" >> $GITHUB_OUTPUT'
                },
                {
                    // Resolve the PR head ONCE, here, and have every job check out exactly this
                    // commit. Jobs in a single run can start tens of minutes apart, and each
                    // `gh pr checkout` would otherwise resolve the PR head at its own start time -
                    // so a push mid-run makes the build job produce output from one commit while
                    // the test jobs run against another.
                    name: "Get PR head SHA",
                    id: "pr-sha",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: 'echo "pr-sha=$(gh pr view ${{ github.event.issue.number }} --json headRefOid -q .headRefOid)" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        constants: createJob({
            needs: "baseBranch",
            name: "Create constants",
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}"
            },
            checkout: false,
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: `echo "global-cache-key=\${{ needs.baseBranch.outputs.base-branch }}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
                }
            ]
        }),
        build: createJob({
            name: "Build",
            needs: ["baseBranch", "constants"],
            checkout: { path: DIR_WEBINY_JS },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [
                ...createCheckoutPrSteps(),
                ...yarnCacheSteps,
                ...globalBuildCacheSteps,
                ...installBuildSteps,
                ...runBuildCacheUploadSteps
            ]
        }),
        ...createCypressJobs("ddb"),
        ...createCypressJobs("ddb-os"),
        ...createServerE2eJobs()
    }
});
