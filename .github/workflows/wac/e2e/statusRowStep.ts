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
    name: string;
    // The step's `if`.
    condition: string;
    // The text for the row's "Status" column.
    status: string;
}

/**
 * One step that rewrites a variant's row in the `/e2e` status comment.
 */
export const createStatusRowStep = (
    row: StatusRow,
    { name, condition, status }: StatusRowStepParams
) => {
    const url = row.urlExpression ?? "-";

    return {
        name,
        if: condition,
        env: {
            GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
            COMMENT_ID: "${{ needs.checkComment.outputs.comment-id }}",
            ...row.env
        },
        run: [
            `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID --jq '.body' > /tmp/comment.txt`,
            `sed -i -E "s@^\\| ${rowPattern(row.label)} \\|.*@| ${row.label} | ${status} | ${url} |@" /tmp/comment.txt`,
            `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID -X PATCH --field body=@/tmp/comment.txt`
        ].join("\n")
    };
};
