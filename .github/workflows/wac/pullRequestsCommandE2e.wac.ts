import { createWorkflow, NormalJob } from "github-actions-wac";
import {
    createDeployWebinySteps,
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createRunBuildCacheSteps,
    createSetupVerdaccioSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";
import { AWS_REGION, BUILD_PACKAGES_RUNNER, NODE_OPTIONS } from "./utils/index.js";
import { createJob } from "./jobs/index.js";

// Will print "next" or "dev". Important for caching (via actions/cache).
const DIR_WEBINY_JS = "${{ needs.baseBranch.outputs.base-branch }}";
const DIR_TEST_PROJECT = "new-webiny-project";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });

const createCheckoutPrSteps = () =>
    [
        {
            name: "Checkout Pull Request",
            "working-directory": DIR_WEBINY_JS,
            run: "gh pr checkout ${{ github.event.issue.number }}",
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
        WEBINY_API_MAX_BUNDLE_SIZE: "${{ vars.WEBINY_API_MAX_BUNDLE_SIZE }}"
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
            ...runBuildCacheSteps,
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
                uses: "actions/upload-artifact@v6",
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
                uses: "actions/upload-artifact@v6",
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
                run: 'echo "API bundle size limit: ${WEBINY_API_MAX_BUNDLE_SIZE:-10} MB"'
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

export const pullRequestsCommandE2e = createWorkflow({
    name: "Pull Requests Command - E2E",
    on: "issue_comment",
    env: {
        NODE_OPTIONS,
        AWS_REGION
    },
    jobs: {
        checkComment: createJob({
            name: `Check comment for /e2e`,
            if: "${{ github.event.issue.pull_request }}",
            checkout: false,
            outputs: {
                "comment-id": "${{ steps.create-comment.outputs.comment-id }}"
            },
            steps: [
                {
                    name: "Check for Command",
                    id: "command",
                    uses: "xt0rted/slash-command-action@v2",
                    with: {
                        "repo-token": "${{ secrets.GITHUB_TOKEN }}",
                        command: "e2e",
                        reaction: "true",
                        "reaction-type": "eyes",
                        "allow-edits": "false",
                        "permission-level": "write"
                    }
                },
                {
                    name: "Create comment",
                    id: "create-comment",
                    uses: "peter-evans/create-or-update-comment@v2",
                    with: {
                        "issue-number": "${{ github.event.issue.number }}",
                        body: "Cypress E2E tests have been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:\n\n| Database | Status | Admin URL |\n| --- | --- | --- |\n| DDB | 🔄 Deploying... | - |\n| DDB+OS | 🔄 Deploying... | - |"
                    }
                }
            ]
        }),
        baseBranch: createJob({
            needs: "checkComment",
            name: "Get base branch",
            outputs: {
                "base-branch": "${{ steps.base-branch.outputs.base-branch }}"
            },
            steps: [
                {
                    name: "Get base branch",
                    id: "base-branch",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: 'echo "base-branch=$(gh pr view ${{ github.event.issue.number }} --json baseRefName -q .baseRefName)" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        constants: createJob({
            needs: "baseBranch",
            name: "Create constants",
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}",
                "run-cache-key": "${{ steps.run-cache-key.outputs.run-cache-key }}"
            },
            checkout: false,
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: `echo "global-cache-key=\${{ needs.baseBranch.outputs.base-branch }}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
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
            needs: ["baseBranch", "constants"],
            checkout: { path: DIR_WEBINY_JS },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [
                ...createCheckoutPrSteps(),
                ...yarnCacheSteps,
                ...globalBuildCacheSteps,
                ...installBuildSteps,
                ...runBuildCacheSteps,
                {
                    name: "Upload build cache artifact",
                    uses: "actions/upload-artifact@v6",
                    with: {
                        name: "build-cache",
                        "retention-days": 1,
                        "include-hidden-files": true,
                        path: `${DIR_WEBINY_JS}/.webiny/cached-packages`
                    }
                }
            ]
        }),
        ...createCypressJobs("ddb"),
        ...createCypressJobs("ddb-os")
    }
});
