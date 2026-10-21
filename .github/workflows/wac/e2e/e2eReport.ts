import type { NormalJob } from "github-actions-wac";

// `markdown` writes `.e2e/summary.md`: counts, spend, and per failed test the error, the failing
// step and the last model turns. `junit` writes `.e2e/junit.xml` for anything that reads it.
export const E2E_REPORTER_ARGS = "--reporter list,junit,markdown";

interface CreateE2eSummaryStepParams {
    workingDirectory: string;
    // Heading above the summary, so several runs in one job stay apart.
    title: string;
}

/**
 * Copies the run's `summary.md` into the job summary, so a failure can be read on the run page
 * without downloading the artifact. Runs right after its `e2e run` step, before the next run in the
 * same job overwrites the file.
 */
export const createE2eSummaryStep = ({
    workingDirectory,
    title
}: CreateE2eSummaryStepParams): NonNullable<NormalJob["steps"]>[number] => ({
    name: `${title} - write job summary`,
    if: "always()",
    "working-directory": workingDirectory,
    run: [
        "if [ -f e2e/.e2e/summary.md ]; then",
        `  echo "## ${title}" >> "$GITHUB_STEP_SUMMARY"`,
        '  cat e2e/.e2e/summary.md >> "$GITHUB_STEP_SUMMARY"',
        "fi"
    ].join("\n")
});
