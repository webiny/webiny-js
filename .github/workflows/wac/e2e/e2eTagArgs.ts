/*
 * The `--tag` argument of an `e2e run` command line, read from the step's `E2E_TAGS` variable and
 * left out when it is empty. The tags come from a PR comment, so they never go into the command line
 * itself: selectE2eAreas.ts lets only known area tags through, and the shell passes the variable
 * quoted, as one argument.
 */
export const E2E_TAG_ARGS = '${E2E_TAGS:+--tag "$E2E_TAGS"}';
