import type { NormalJob } from "github-actions-wac";
import { createCheckoutPrSteps } from "../steps/index.js";
import { createConfigureBugReporterSteps } from "../steps/index.js";
import { createDeployWebinySteps } from "../steps/index.js";
import { BUG_REPORTER_ENV } from "../steps/index.js";
import { ACTION } from "../utils/index.js";
import { createJob } from "../jobs/index.js";
import { DIR_TEST_PROJECT, DIR_WEBINY_JS, PATH_TEST_PROJECT } from "./constants.js";
import { createReportStatusJob } from "./reportStatus.js";
import { createInstallationTestSteps, createPlaywrightSetupSteps } from "./installationTest.js";
import { createUnlicensedE2eSteps } from "./unlicensedE2e.js";
import { installSteps, yarnCacheSteps } from "./sharedSteps.js";
import { createRestoreVerdaccioSteps } from "./verdaccio.js";

export interface AwsVariant {
    // The project's storage setup, as create-webiny-project takes it.
    dbSetup: "ddb" | "ddb-os";
    // How many test jobs split the variant's tests between them (`e2e run --shard i/N`).
    shards: number;
}

// AWS-deployed E2E. One variant per storage setup, three jobs each, the same shape as the
// standalone variants (createStandaloneVariantJobs):
// - deploy: scaffolds a project, deploys it with Pulumi, and runs the installation test against it.
//   The installation test runs here rather than in the shards because every shard tests the same
//   deployment, so it can be installed only once. It also creates the admin user the shards sign
//   in with.
// - tests: one job per shard, against the deployed Admin app's URL. All shards share the one
//   deployment and its database, so tests must not depend on each other's data.
// - report status: writes the shards' combined result and the Admin URL into the status comment.
//
// Pulumi keeps its state in the project's local `.pulumi` folder, which goes away with the runner.
// Nothing needs it afterwards: the nightly `cleanup.yml` removes the deployed resources with
// aws-nuke rather than `webiny destroy`.
export const createAwsJobs = ({ dbSetup, shards }: AwsVariant) => {
    const jobKeys = {
        deploy: `e2e-aws-${dbSetup}-deploy`,
        tests: `e2e-aws-${dbSetup}`,
        report: `e2e-aws-${dbSetup}-report`
    };

    const dbDisplayName = dbSetup === "ddb-os" ? "DDB+OS" : "DDB";
    const adminUrl = `\${{ needs.${jobKeys.deploy}.outputs.admin-url }}`;

    const env: Record<string, string> = {
        PULUMI_CONFIG_PASSPHRASE: "${{ secrets.PULUMI_CONFIG_PASSPHRASE }}",
        PULUMI_SECRETS_PROVIDER: "${{ secrets.PULUMI_SECRETS_PROVIDER }}",
        WEBINY_INFRA_API_MAX_BUNDLE_SIZE: "${{ vars.WEBINY_INFRA_API_MAX_BUNDLE_SIZE }}",
        /*
         * Read by `<Project.BugReporter>` while `webiny deploy api` builds, so it has to be on the
         * job that deploys, not only on the step that edits the config.
         */
        ...BUG_REPORTER_ENV
    };

    if (dbSetup === "ddb-os") {
        env["AWS_OPENSEARCH_DOMAIN_NAME"] = "${{ secrets.OPENSEARCH_DOMAIN_NAME }}";
        env["OPENSEARCH_ENDPOINT"] = "${{ secrets.OPENSEARCH_ENDPOINT }}";
        env["OPENSEARCH_USERNAME"] = "${{ secrets.OPENSEARCH_USERNAME }}";
        env["OPENSEARCH_PASSWORD"] = "${{ secrets.OPENSEARCH_PASSWORD }}";
        env["OPENSEARCH_INDEX_PREFIX"] = "${{ github.run_id }}_";
    }

    const deployJob: NormalJob = createJob({
        needs: ["baseBranch", "publish", "checkComment"],
        name: `E2E - ${dbDisplayName} - Deploy`,
        // Writes the admin URL into the status comment.
        permissions: { "pull-requests": "write" },
        outputs: { "admin-url": "${{ steps.admin-url.outputs.admin-url }}" },
        environment: "next",
        env,
        awsAuth: true,
        checkout: { path: DIR_WEBINY_JS },
        steps: [
            ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...yarnCacheSteps,
            ...installSteps,
            ...createRestoreVerdaccioSteps({ workingDirectory: DIR_WEBINY_JS }),
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
                    GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
                    ADMIN_URL: `\${{ steps.admin-url.outputs.admin-url }}`,
                    COMMENT_ID: `\${{ needs.checkComment.outputs.comment-id }}`
                },
                run: [
                    `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID --jq '.body' > /tmp/comment.txt`,
                    `sed -i "s@| ${dbDisplayName} | 🔄 Deploying... | - |@| ${dbDisplayName} | ✅ Ready | $ADMIN_URL |@" /tmp/comment.txt`,
                    `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID -X PATCH --field body=@/tmp/comment.txt`
                ].join("\n")
            },
            ...createInstallationTestSteps({
                workingDirectory: DIR_WEBINY_JS,
                adminUrl: "${{ steps.admin-url.outputs.admin-url }}",
                artifactName: `e2e-results-${dbSetup}`
            })
        ]
    });

    const testsJob = createJob({
        needs: ["baseBranch", jobKeys.deploy],
        name: `E2E - ${dbDisplayName} / shard \${{ matrix.shard }}`,
        strategy: {
            // Every shard reports, so one failure doesn't hide the others.
            "fail-fast": false,
            matrix: { shard: Array.from({ length: shards }, (_, i) => i + 1) }
        },
        checkout: { path: DIR_WEBINY_JS },
        steps: [
            ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...yarnCacheSteps,
            ...installSteps,
            ...createPlaywrightSetupSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...createUnlicensedE2eSteps({
                workingDirectory: DIR_WEBINY_JS,
                adminUrl,
                artifactName: `e2e-test-results-${dbSetup}-shard-\${{ matrix.shard }}`,
                shard: `\${{ matrix.shard }}/${shards}`
            })
        ]
    });

    // The deploy job sets the row to "✅ Ready" with the URL as soon as the deploy succeeds, before
    // any test has run. This replaces it with the tests' result.
    const reportJob = createReportStatusJob({
        label: dbDisplayName,
        buildJobKey: jobKeys.deploy,
        testsJobKey: jobKeys.tests,
        urlExpression: "${ADMIN_URL:--}",
        env: { ADMIN_URL: adminUrl }
    });

    return {
        [jobKeys.deploy]: deployJob,
        [jobKeys.tests]: testsJob,
        [jobKeys.report]: reportJob
    };
};
