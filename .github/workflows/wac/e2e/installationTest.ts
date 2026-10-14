import type { NormalJob } from "github-actions-wac";
import { ACTION } from "../utils/index.js";

interface CreateInstallationTestStepsParams {
    workingDirectory: string;
    // Shell expression for the Admin app's URL.
    adminUrl: string;
    artifactName: string;
    // Writes the Cypress config, for branches that predate the e2e test (see the fallback below).
    // Only `/e2e` needs it: `push` always runs the workflow from the commit it tests.
    cypressSetup?: string;
}

/**
 * The `/e2e` smoke test every variant runs: a freshly created project installs through the wizard
 * and the admin lands in the dashboard. It also creates the admin user later tests sign in with.
 */
export const createInstallationTestSteps = ({
    workingDirectory,
    adminUrl,
    artifactName,
    cypressSetup
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
            ...(cypressSetup
                ? [
                      // `/e2e` runs this workflow from the default branch against any PR, and
                      // branches cut before the Cypress suite was removed (release/6.5.0) still only
                      // have the Cypress spec. Remove this fallback once no such branch takes PRs.
                      "if [ ! -f e2e/tests/installation.e2e.ts ]; then",
                      '  echo "::notice::This branch has no e2e installation test. Running the Cypress one."',
                      `  ${cypressSetup}`,
                      "  (cd cypress-tests && yarn cypress install)",
                      '  yarn cy:run --browser chrome --spec "cypress/e2e/adminInstallation/**/*.cy.js"',
                      "  exit $?",
                      "fi"
                  ]
                : []),
            "yarn workspace e2e-tests playwright install --with-deps chromium",
            "yarn e2e --tag installation"
        ].join("\n")
    },
    {
        // Report, screenshots and traces.
        name: "E2E - upload installation test results",
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
