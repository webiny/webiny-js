import type { NormalJob } from "github-actions-wac";
import { ACTION } from "../utils/index.js";
import { STANDALONE_ADMIN_URL } from "./constants.js";

// Experimental: the AI-driven tests in `e2e/` (TesterArmy's e2e framework). Their job only runs when
// one of these people posts the `/e2e` comment, so nobody else's run changes while the suite settles.
const AI_E2E_USERS = ["adrians5j"];

const IS_AI_E2E_RUN = `contains(fromJSON('${JSON.stringify(AI_E2E_USERS)}'), github.event.comment.user.login)`;

export const AI_E2E_JOB_IF = `\${{ ${IS_AI_E2E_RUN} }}`;

// "WCP" for a project connected to WCP, which this job always is, with the full license.
export const AI_E2E_VARIANT_LABEL = "Standalone (SQLite, WCP)";

/**
 * The job's row in the `/e2e` status comment, present only on runs the job actually takes part in.
 * The comment body is an action input, so GitHub evaluates this before posting. It must be the
 * table's LAST row: for everyone else it renders as an empty line, which ends the table, so any row
 * after it would fall out.
 */
export const AI_E2E_COMMENT_ROW = `\${{ ${IS_AI_E2E_RUN} && '| ${AI_E2E_VARIANT_LABEL} | 🔄 Running... | - |' || '' }}`;

/**
 * The AI tests need AI Power-Ups, which is license-gated: without a WCP license the settings screen
 * is never registered. The CLI fetches the license from these two at build time, and the API, which
 * is started directly with `node start.mjs`, derives it from the same pair at runtime. Hence both
 * the build step and the start step get them.
 *
 * Only the dedicated AI job gets these. The regular standalone jobs stay unlicensed, so `/e2e` keeps
 * covering a project without WCP.
 */
export const AI_E2E_LICENSE_ENV: Record<string, string> = {
    WEBINY_PROJECT_ID: "${{ secrets.E2E_WEBINY_PROJECT_ID }}",
    WEBINY_PROJECT_API_KEY: "${{ secrets.E2E_WEBINY_PROJECT_API_KEY }}"
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
        if: "always()",
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
