import type { NormalJob } from "github-actions-wac";
import { ACTION } from "../utils/index.js";

interface CreateUnlicensedE2eStepsParams {
    workingDirectory: string;
    // Shell expression for the Admin app's URL.
    adminUrl: string;
    artifactName: string;
}

/**
 * The `e2e/` tests that run on any project: no `wcp` or `ai` tag, so no license and no model. Today
 * that is the login test. Runs after the installation test, which created the admin user and
 * installed the browser. The WCP jobs skip this, since their own run (aiE2e.ts) covers these tests.
 */
export const createUnlicensedE2eSteps = ({
    workingDirectory,
    adminUrl,
    artifactName
}: CreateUnlicensedE2eStepsParams): NonNullable<NormalJob["steps"]> => [
    {
        name: "E2E - run tests",
        "working-directory": workingDirectory,
        env: {
            E2E_ADMIN_URL: adminUrl,
            E2E_TELEMETRY_DISABLED: "1"
        },
        run: "yarn e2e --exclude-tag wcp,ai,installation --pass-with-no-tests"
    },
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
