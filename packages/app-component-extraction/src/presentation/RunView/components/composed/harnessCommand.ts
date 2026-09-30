/**
 * The command that photographs a run's composed pages.
 *
 * Shown in the admin because the capture is a step someone has to run by hand, and a view that says
 * "nobody has run the harness" without saying how is telling half of it. It stops being needed the
 * moment the website app can be deployed and the capture moves into a task.
 *
 * The run id is single-quoted, and that is not decoration: ids contain a `#`, which a shell reads as
 * the start of a comment. Unquoted, the command silently truncates the id and reports a run that does
 * not exist — the copied command has to be correct on paste, or this is worse than showing nothing.
 */
export const harnessCommand = (runId: string): string =>
    `node packages/api-page-composition-poc/scripts/comparePages/index.js '${runId}'`;
