import type { NormalJob } from "github-actions-wac";

interface CreateStatusRowUpdateStepsParams {
    // The row's label in the status comment's first column, e.g. "DDB" or "Server (SQLite)".
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
// The labels are not regex-safe: "DDB+OS" contains a quantifier and "Server (SQLite)" contains a
// group, and this is an EXTENDED regular expression (`sed -E`), so both would otherwise match
// something other than themselves - "Server (SQLite)" would only match the literal text
// "Server SQLite" and silently never fire.
const rowPattern = (label: string) => label.replace(/[\\.[\]{}()*+?^$|]/g, String.raw`\$&`);

const updateStep = (
    params: CreateStatusRowUpdateStepsParams,
    { outcome, status }: { outcome: "success" | "failure"; status: string }
) => {
    const url = params.urlExpression ?? "-";

    return {
        name: `Update PR comment - ${params.label} ${outcome === "success" ? "passed" : "failed"}`,
        if: `${outcome}()`,
        env: {
            GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}",
            COMMENT_ID: "${{ needs.checkComment.outputs.comment-id }}",
            ...params.env
        },
        run: [
            `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID --jq '.body' > /tmp/comment.txt`,
            `sed -i -E "s@^\\| ${rowPattern(params.label)} \\|.*@| ${params.label} | ${status} | ${url} |@" /tmp/comment.txt`,
            `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID -X PATCH --field body=@/tmp/comment.txt`
        ].join("\n")
    };
};

/**
 * The pair of steps that write a variant's final result into the `/e2e` status comment.
 *
 * Every variant reports both outcomes. Previously only the AWS rows were updated, and only on the
 * way through - they flipped to "✅ Ready" once the deploy succeeded and then never changed again,
 * so a failed Cypress run left the comment claiming the variant was fine.
 */
export const createStatusRowUpdateSteps = (
    params: CreateStatusRowUpdateStepsParams
): NonNullable<NormalJob["steps"]> => [
    updateStep(params, { outcome: "success", status: "✅ Passed" }),
    updateStep(params, { outcome: "failure", status: "❌ Failed" })
];
