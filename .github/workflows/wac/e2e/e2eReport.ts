import type { NormalJob } from "github-actions-wac";

// `markdown` writes `.e2e/summary.md`: counts, spend, and per failed test the error, the failing
// step and the last model turns. `junit` writes `.e2e/junit.xml` for anything that reads it.
export const E2E_REPORTER_ARGS = "--reporter list,junit,markdown";

// The first line of every `e2e run` step. Another run earlier in the same job leaves its
// `summary.md` behind, and a run that stops before writing one (or a step that exits without
// running) would otherwise have that summary published under its own heading.
export const E2E_CLEAR_SUMMARY = "rm -f e2e/.e2e/summary.md";

interface CreateE2eSummaryStepParams {
    workingDirectory: string;
    // Heading above the summary, so several runs in one job stay apart.
    title: string;
    // `id` of the `e2e run` step this summary belongs to.
    runStepId: string;
}

/**
 * Copies the run's `summary.md` into the job summary, so a failure can be read on the run page
 * without downloading the artifact. Runs right after its `e2e run` step, pass or fail, but not when
 * that step was skipped because an earlier one failed.
 */
export const createE2eSummaryStep = ({
    workingDirectory,
    title,
    runStepId
}: CreateE2eSummaryStepParams): NonNullable<NormalJob["steps"]>[number] => ({
    name: `${title} - write job summary`,
    if: `always() && steps.${runStepId}.outcome != 'skipped'`,
    "working-directory": workingDirectory,
    run: [
        "if [ -f e2e/.e2e/summary.md ]; then",
        `  echo "## ${title}" >> "$GITHUB_STEP_SUMMARY"`,
        '  cat e2e/.e2e/summary.md >> "$GITHUB_STEP_SUMMARY"',
        "fi"
    ].join("\n")
});
