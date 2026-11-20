const MAX_ATTEMPTS = 5;

// Matches the row by its label and replaces the WHOLE line, rather than matching the exact text it
// currently holds. The row's contents change during a run - "🔄 Deploying..." becomes "✅ Ready"
// with a URL once the deploy finishes - so an exact-match substitution silently stops matching
// depending on how far the job got.
//
// The labels are not regex-safe: "DDB+OS" contains a quantifier and "Standalone (SQLite)" contains a
// group, and this is an EXTENDED regular expression (`sed -E`), so both would otherwise match
// something other than themselves - "Standalone (SQLite)" would only match the literal text
// "Standalone SQLite" and silently never fire.
const rowPattern = (label: string) => label.replace(/[\\.[\]{}()*+?^$|]/g, String.raw`\$&`);

interface CommentRowUpdateRunParams {
    // The row's first column, which is how the row is found.
    label: string;
    // Where the comment body is kept while it is edited.
    bodyFile: string;
}

/**
 * Shell lines that write one row of a slash command's status comment (`/e2e`, `/vitest`). The step
 * must set `$row` to the whole row line and `$COMMENT_ID` to the comment before these lines, and
 * they must be the last of the step, since they end it with `exit 0`.
 *
 * The comment is one body shared by every row, and GitHub can only replace it whole, so each update
 * reads the body, edits its own row and writes the body back. Two jobs doing that at the same moment
 * lose one of the two rows: the later write carries the row as it was before the earlier one. After
 * writing, this waits a few seconds (long enough for a write that read the old body to land), reads
 * the comment back, and starts over if its row is not there. A failed API call is retried the same
 * way, since the comment only reports results and must not fail the job. A failed read skips the
 * write, so a bad read can't wipe the table.
 *
 * A row can still be overwritten after it was checked, by a write that stalled longer than the
 * wait, so each workflow also rewrites every row once at the end, when no other job writes.
 */
export const commentRowUpdateRun = ({ label, bodyFile }: CommentRowUpdateRunParams) => {
    const comment = "repos/${{ github.repository }}/issues/comments/$COMMENT_ID";
    const retryOnError = (what: string) =>
        `|| { echo "Could not ${what} the status comment (attempt $attempt of ${MAX_ATTEMPTS})."; sleep 3; continue; }`;

    return [
        `for attempt in $(seq 1 ${MAX_ATTEMPTS}); do`,
        `  gh api ${comment} --jq '.body' > ${bodyFile} ${retryOnError("read")}`,
        `  sed -i -E "s@^\\| ${rowPattern(label)} \\|.*@$row@" ${bodyFile}`,
        `  gh api ${comment} -X PATCH --field body=@${bodyFile} > /dev/null ${retryOnError("write")}`,
        "  sleep $((RANDOM % 4 + 3))",
        `  if gh api ${comment} --jq '.body' | grep -qxF "$row"; then`,
        '    echo "Row written: $row"',
        "    exit 0",
        "  fi",
        `  echo "Another job's write replaced the row (attempt $attempt of ${MAX_ATTEMPTS})."`,
        "done",
        `echo "::warning::The status comment row for ${label} could not be written after ${MAX_ATTEMPTS} attempts."`
    ].join("\n");
};
