import type { NormalJob } from "github-actions-wac";
import { ACTION } from "../utils/index.js";
import { createE2eSummaryStep, E2E_REPORTER_ARGS } from "./e2eReport.js";

interface CreateInstallationTestStepsParams {
    workingDirectory: string;
    // Shell expression for the Admin app's URL.
    adminUrl: string;
    artifactName: string;
    // Save the Playwright browser cache after the job. Only workflows on a trusted trigger
    // (`push`) can: `/e2e` runs on `issue_comment`, whose cache token is read-only (see
    // createYarnCacheSteps), so it only restores.
    savePlaywrightCache?: boolean;
}

/**
 * The `/e2e` smoke test every variant runs: a freshly created project installs and the admin lands
 * in the dashboard. It also creates the admin user later tests sign in with, and installs the
 * browser they use.
 */
export const createInstallationTestSteps = ({
    workingDirectory,
    adminUrl,
    artifactName,
    savePlaywrightCache = false
}: CreateInstallationTestStepsParams): NonNullable<NormalJob["steps"]> => [
    {
        name: "Resolve Playwright version",
        id: "playwright-version",
        "working-directory": workingDirectory,
        run: `echo "version=$(yarn workspace e2e-tests playwright --version | cut -d' ' -f2)" >> $GITHUB_OUTPUT`
    },
    {
        // Browsers only. `--with-deps` below still installs the system packages, which are not
        // cached, and skips the browser download when this restored it.
        name: "Cache Playwright browsers",
        uses: savePlaywrightCache ? ACTION.cache : ACTION.cacheRestore,
        with: {
            path: "~/.cache/ms-playwright",
            key: "playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}"
        }
    },
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
            `yarn e2e --tag installation ${E2E_REPORTER_ARGS}`
        ].join("\n")
    },
    createE2eSummaryStep({ workingDirectory, title: "E2E - installation" }),
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
