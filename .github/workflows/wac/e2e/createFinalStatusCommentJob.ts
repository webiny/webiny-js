import { createJob } from "../jobs/index.js";

const MAX_ATTEMPTS = 5;

interface CreateFinalStatusCommentJobParams {
    // Keys of every variant's report job (createReportStatusJob). Each has a `row` output.
    reportJobKeys: [string, ...string[]];
}

/**
 * Rewrites every variant's row in the `/e2e` status comment once, after all the report jobs are done.
 *
 * Rows are updated by many jobs while the run is going, each reading and writing the whole comment,
 * and createStatusRowStep can't rule out a stalled write replacing a row after it checked it. This job
 * waits for every report job, so it is the only one writing, and puts back the row each report job
 * last wrote. A report job that didn't write a row (it was cancelled before it got there) leaves its
 * row as it is.
 *
 * Rows are matched by plain string comparison on the label, not a regular expression, because labels
 * such as "Standalone (SQLite)" and "DDB+OS" contain regex metacharacters.
 */
export const createFinalStatusCommentJob = ({
    reportJobKeys
}: CreateFinalStatusCommentJobParams) => {
    const comment = "repos/${{ github.repository }}/issues/comments/$COMMENT_ID";
    const env: Record<string, string> = {
        GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
        COMMENT_ID: "${{ needs.checkComment.outputs.comment-id }}"
    };
    const rowVariables = reportJobKeys.map((key, index) => {
        const variable = `ROW_${index + 1}`;
        env[variable] = `\${{ needs.${key}.outputs.row }}`;
        return `"$${variable}"`;
    });

    return createJob({
        needs: ["checkComment", ...reportJobKeys],
        name: "E2E - Final status comment",
        if: "${{ !cancelled() && needs.checkComment.outputs.comment-id != '' }}",
        permissions: { "pull-requests": "write" },
        checkout: false,
        steps: [
            {
                name: "Rewrite every row of the status comment",
                env,
                run: [
                    "set -euo pipefail",
                    "rows=()",
                    `for row in ${rowVariables.join(" ")}; do`,
                    '  if [ -n "$row" ]; then rows+=("$row"); fi',
                    "done",
                    'if [ "${#rows[@]}" -eq 0 ]; then',
                    '  echo "No report job wrote a row."',
                    "  exit 0",
                    "fi",
                    `for attempt in $(seq 1 ${MAX_ATTEMPTS}); do`,
                    `  gh api ${comment} --jq '.body' > /tmp/comment.txt || { sleep 3; continue; }`,
                    '  while IFS= read -r line || [ -n "$line" ]; do',
                    '    for row in "${rows[@]}"; do',
                    '      label="${row#| }"',
                    '      label="${label%% | *}"',
                    '      if [[ "$line" == "| $label | "* ]]; then',
                    '        line="$row"',
                    "        break",
                    "      fi",
                    "    done",
                    "    printf '%s\\n' \"$line\"",
                    "  done < /tmp/comment.txt > /tmp/final-comment.txt",
                    `  gh api ${comment} -X PATCH --field body=@/tmp/final-comment.txt > /dev/null || { sleep 3; continue; }`,
                    '  printf "Row written: %s\\n" "${rows[@]}"',
                    "  exit 0",
                    "done",
                    `echo "::warning::The status comment could not be rewritten after ${MAX_ATTEMPTS} attempts."`
                ].join("\n")
            }
        ]
    });
};
