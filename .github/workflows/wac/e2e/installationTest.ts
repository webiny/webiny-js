import type { NormalJob } from "github-actions-wac";
import { ACTION } from "../utils/index.js";
import { createE2eSummaryStep, E2E_CLEAR_SUMMARY, E2E_REPORTER_ARGS } from "./e2eReport.js";

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

interface CreatePlaywrightSetupStepsParams {
    workingDirectory: string;
    // See CreateInstallationTestStepsParams.
    savePlaywrightCache?: boolean;
}

// Starts and closes Chromium. Fails when a system library it needs is missing.
const PLAYWRIGHT_LAUNCH_PROBE =
    "import { chromium } from 'playwright'; const browser = await chromium.launch(); await browser.close();";

/**
 * Installs the browser `e2e run` drives, from the cache when it has this Playwright version.
 */
export const createPlaywrightSetupSteps = ({
    workingDirectory,
    savePlaywrightCache = false
}: CreatePlaywrightSetupStepsParams): NonNullable<NormalJob["steps"]> => [
    {
        name: "Resolve Playwright version",
        id: "playwright-version",
        "working-directory": workingDirectory,
        run: `echo "version=$(yarn workspace e2e-tests playwright --version | cut -d' ' -f2)" >> $GITHUB_OUTPUT`
    },
    {
        // Browsers only. The system packages they need are not cached (see the next step).
        name: "Cache Playwright browsers",
        uses: savePlaywrightCache ? ACTION.cache : ACTION.cacheRestore,
        with: {
            path: "~/.cache/ms-playwright",
            key: "playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}"
        }
    },
    {
        // Installs the system packages only when the browser can't start without them.
        // `--with-deps` ran `apt-get install` every time, and in one /e2e run (39778288407) 4 of 12
        // jobs spent 4.6 to 7 minutes fetching its packages from a mirror at about 65 kB/s.
        // GitHub-hosted Ubuntu runners ship Google Chrome, so the libraries Chromium needs are
        // already there; on a runner without them, the launch fails and `install-deps` runs.
        name: "Install Playwright browser",
        "working-directory": `${workingDirectory}/e2e`,
        run: [
            "yarn playwright install chromium",
            `if yarn node --input-type=module -e "${PLAYWRIGHT_LAUNCH_PROBE}"; then`,
            '  echo "Chromium starts without installing system packages."',
            "else",
            '  echo "::warning::Chromium did not start. Installing its system packages."',
            "  yarn playwright install-deps chromium",
            "fi"
        ].join("\n")
    }
];

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
    ...createPlaywrightSetupSteps({ workingDirectory, savePlaywrightCache }),
    {
        name: "E2E - run installation wizard test",
        id: "e2e-installation",
        "working-directory": workingDirectory,
        env: {
            E2E_ADMIN_URL: adminUrl,
            E2E_INSTALLATION: "1",
            E2E_TELEMETRY_DISABLED: "1"
        },
        run: [E2E_CLEAR_SUMMARY, `yarn e2e --tag installation ${E2E_REPORTER_ARGS}`].join("\n")
    },
    createE2eSummaryStep({
        workingDirectory,
        title: "E2E - installation",
        runStepId: "e2e-installation"
    }),
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
