import type { NormalJob } from "github-actions-wac";
import { ACTION } from "../utils/index.js";
import { STANDALONE_ADMIN_URL } from "./constants.js";

// Experimental: the AI-driven tests in `e2e/` (TesterArmy's e2e framework). They run only when one
// of these people posts the `/e2e` comment, so nobody else's run changes while the suite settles.
const AI_E2E_USERS = ["adrians5j"];

// Expression body, without `${{ }}`, so it can be combined with status functions like `always()`.
const IS_AI_E2E_RUN = `contains(fromJSON('${JSON.stringify(AI_E2E_USERS)}'), github.event.comment.user.login)`;

/**
 * The AI tests need AI Power-Ups, which is license-gated: without a WCP license the settings screen
 * is never registered. The CLI fetches the license from these two at build time, and the API, which
 * is started directly with `node start.mjs`, derives it from the same pair at runtime. Hence both
 * the build step and the start step get them. Empty for everyone else, so their runs stay unlicensed.
 */
export const AI_E2E_LICENSE_ENV: Record<string, string> = {
    WEBINY_PROJECT_ID: `\${{ ${IS_AI_E2E_RUN} && secrets.E2E_WEBINY_PROJECT_ID || '' }}`,
    WEBINY_PROJECT_API_KEY: `\${{ ${IS_AI_E2E_RUN} && secrets.E2E_WEBINY_PROJECT_API_KEY || '' }}`
};

interface CreateAiE2eStepsParams {
    workingDirectory: string;
    artifactName: string;
}

/**
 * Runs after Cypress, whose installation wizard creates the admin user the tests sign in with
 * (`admin@webiny.com`, the e2e config's default).
 */
export const createAiE2eSteps = ({
    workingDirectory,
    artifactName
}: CreateAiE2eStepsParams): NonNullable<NormalJob["steps"]> => [
    {
        name: "AI E2E - run tests",
        if: `\${{ ${IS_AI_E2E_RUN} }}`,
        "working-directory": workingDirectory,
        env: {
            ANTHROPIC_API_KEY: "${{ secrets.ANTHROPIC_API_KEY }}",
            E2E_ADMIN_URL: STANDALONE_ADMIN_URL,
            E2E_TELEMETRY_DISABLED: "1"
        },
        run: [
            // `/e2e` runs this workflow from the default branch against any PR, including ones
            // branched before `e2e/` existed.
            "if [ ! -f e2e/e2e.config.ts ]; then",
            '  echo "::notice::This branch has no e2e/ folder. Skipping the AI E2E tests."',
            "  exit 0",
            "fi",
            "yarn workspace e2e-tests playwright install --with-deps chromium",
            "yarn e2e"
        ].join("\n")
    },
    {
        // Report, screenshots and traces, pass or fail.
        name: "AI E2E - upload results",
        if: `\${{ always() && ${IS_AI_E2E_RUN} }}`,
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
