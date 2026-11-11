import type { NormalJob } from "github-actions-wac";

export interface StatusRow {
    // The row's label in the status comment's first column, e.g. "DDB" or "Standalone (SQLite)".
    label: string;
    // Shell expression producing the "Admin URL" cell. Defaults to "-" for variants that have no
    // URL anyone outside the job could open.
    urlExpression?: string;
    // Extra env the URL expression needs (e.g. ADMIN_URL from an earlier step's output).
    env?: Record<string, string>;
}

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

interface StatusRowStepParams {
    /*
     * The step's id. The row it writes is also its `row` output, which the report job hands to
     * the job that rewrites the whole table at the end (createFinalStatusCommentJob).
     */
    id?: string;
    name: string;
    // The step's `if`.
    condition: string;
    // The text for the row's "Status" column.
    status: string;
}

type JobStep = NonNullable<NormalJob["steps"]>[number];

const MAX_ATTEMPTS = 5;

/**
 * One step that rewrites a variant's row in the `/e2e` status comment.
 *
 * The comment is one body shared by every variant, and GitHub can only replace it whole, so each
 * update reads the body, edits its own row and writes the body back. Two jobs doing that at the same
 * moment lose one of the two rows: the later write carries the row as it was before the earlier one.
 * Variants that are skipped all report within the same second, so this is not rare. After writing,
 * the step waits a few seconds (long enough for a write that read the old body to land), reads the
 * comment back, and starts over if its row is not there. A failed API call is retried the same way:
 * the status comment only reports results, so it must not fail a deploy or a report job.
 *
 * A row can still be overwritten after it was checked, by a write that stalled longer than the
 * wait. createFinalStatusCommentJob rewrites every row once at the end, when no other job writes.
 */
export const createStatusRowStep = (
    row: StatusRow,
    { id, name, condition, status }: StatusRowStepParams
) => {
    const url = row.urlExpression ?? "-";
    const comment = `repos/\${{ github.repository }}/issues/comments/$COMMENT_ID`;
    /*
     * `continue` on a failed read as well as a failed write: carrying on after a failed read would
     * write an empty body and wipe the whole table.
     */
    const retryOnError = (what: string) =>
        `|| { echo "Could not ${what} the status comment (attempt $attempt of ${MAX_ATTEMPTS})."; sleep 3; continue; }`;

    const step: JobStep = {
        name,
        if: condition,
        env: {
            GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
            COMMENT_ID: "${{ needs.checkComment.outputs.comment-id }}",
            ...row.env
        },
        run: [
            "set -euo pipefail",
            `row="| ${row.label} | ${status} | ${url} |"`,
            'echo "row=$row" >> $GITHUB_OUTPUT',
            `for attempt in $(seq 1 ${MAX_ATTEMPTS}); do`,
            `  gh api ${comment} --jq '.body' > /tmp/comment.txt ${retryOnError("read")}`,
            `  sed -i -E "s@^\\| ${rowPattern(row.label)} \\|.*@$row@" /tmp/comment.txt`,
            `  gh api ${comment} -X PATCH --field body=@/tmp/comment.txt > /dev/null ${retryOnError("write")}`,
            "  sleep $((RANDOM % 4 + 3))",
            `  if gh api ${comment} --jq '.body' | grep -qxF "$row"; then`,
            '    echo "Row written: $row"',
            "    exit 0",
            "  fi",
            `  echo "Another job's write replaced the row (attempt $attempt of ${MAX_ATTEMPTS})."`,
            "done",
            `echo "::warning::The status comment row for ${row.label} could not be written after ${MAX_ATTEMPTS} attempts."`
        ].join("\n")
    };
    if (id) {
        step.id = id;
    }
    return step;
};
