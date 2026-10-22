import type { NormalJob } from "github-actions-wac";
import { ACTION } from "../utils/index.js";
import { createE2eSummaryStep, E2E_CLEAR_SUMMARY, E2E_REPORTER_ARGS } from "./e2eReport.js";

interface CreateUnlicensedE2eStepsParams {
    workingDirectory: string;
    // Shell expression for the Admin app's URL.
    adminUrl: string;
    artifactName: string;
    // This job's slice of the suite, as `--shard` takes it, e.g. `2/3`. Without it the job runs all
    // of the selected tests.
    shard?: string;
}

/**
 * The `e2e/` tests that run on any project: no `wcp` or `ai` tag, so no license and no model. Today
 * that is the login test. Needs the admin user the installation test creates, and the browser
 * (createPlaywrightSetupSteps). The WCP jobs skip this, since their own run (aiE2e.ts) covers these
 * tests.
 */
export const createUnlicensedE2eSteps = ({
    workingDirectory,
    adminUrl,
    artifactName,
    shard
}: CreateUnlicensedE2eStepsParams): NonNullable<NormalJob["steps"]> => [
    {
        name: "E2E - run tests",
        id: "e2e-tests",
        "working-directory": workingDirectory,
        env: {
            E2E_ADMIN_URL: adminUrl,
            E2E_TELEMETRY_DISABLED: "1"
        },
        run: [
            E2E_CLEAR_SUMMARY,
            [
                "yarn e2e --exclude-tag wcp,ai,installation",
                ...(shard ? [`--shard ${shard}`] : []),
                `--pass-with-no-tests ${E2E_REPORTER_ARGS}`
            ].join(" ")
        ].join("\n")
    },
    createE2eSummaryStep({ workingDirectory, title: "E2E - tests", runStepId: "e2e-tests" }),
    {
        // Report, screenshots and traces.
        name: "E2E - upload test results",
        if: "failure()",
        uses: ACTION.uploadArtifactV6,
        with: {
            name: artifactName,
            "retention-days": 7,
            "if-no-files-found": "ignore",
            "include-hidden-files": true,
            path: `${workingDirectory}/e2e/.e2e`
        }
    }
];
