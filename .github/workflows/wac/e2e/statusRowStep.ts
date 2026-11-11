import type { NormalJob } from "github-actions-wac";
import { commentRowUpdateRun } from "../utils/index.js";

export interface StatusRow {
    // The row's label in the status comment's first column, e.g. "DDB" or "Standalone (SQLite)".
    label: string;
    // Shell expression producing the "Admin URL" cell. Defaults to "-" for variants that have no
    // URL anyone outside the job could open.
    urlExpression?: string;
    // Extra env the URL expression needs (e.g. ADMIN_URL from an earlier step's output).
    env?: Record<string, string>;
}

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

/**
 * One step that rewrites a variant's row in the `/e2e` status comment. See commentRowUpdateRun for
 * how the row survives other jobs writing at the same time. The row it writes is also the step's
 * `row` output.
 */
export const createStatusRowStep = (
    row: StatusRow,
    { id, name, condition, status }: StatusRowStepParams
) => {
    const url = row.urlExpression ?? "-";
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
            commentRowUpdateRun({ label: row.label, bodyFile: "/tmp/comment.txt" })
        ].join("\n")
    };
    if (id) {
        step.id = id;
    }
    return step;
};
