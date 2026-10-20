import type { NormalJob } from "github-actions-wac";

interface CreateInstallationTestStepsParams {
    workingDirectory: string;
    // Shell expression for the Admin app's URL.
    adminUrl: string;
    artifactName: string;
}

/**
 * The E2E smoke test: a freshly deployed project installs through the wizard and the admin lands
 * in the dashboard. The test lives in `e2e/tests/installation.e2e.ts`.
 */
export const createInstallationTestSteps = ({
    workingDirectory,
    adminUrl,
    artifactName
}: CreateInstallationTestStepsParams): NonNullable<NormalJob["steps"]> => [
    {
        name: "E2E - run installation wizard test",
        "working-directory": workingDirectory,
        env: {
            E2E_ADMIN_URL: adminUrl,
            E2E_INSTALLATION: "1",
            E2E_TELEMETRY_DISABLED: "1"
        },
        run: [
            "yarn workspace e2e-tests playwright install --with-deps chromium",
            "yarn e2e --tag installation"
        ].join("\n")
    },
    {
        // Report, screenshots and traces.
        name: "E2E - upload installation test results",
        if: "failure()",
        uses: "actions/upload-artifact@v6",
        with: {
            name: artifactName,
            "retention-days": 7,
            "if-no-files-found": "ignore",
            "include-hidden-files": true,
            path: `${workingDirectory}/e2e/.e2e`
        }
    }
];
