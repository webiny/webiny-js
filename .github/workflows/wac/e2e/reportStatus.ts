import { createJob } from "../jobs/index.js";
import { createStatusRowStep, createStatusRowUpdateSteps } from "./statusComment.js";

interface CreateReportStatusJobParams {
    // The variant's row label in the status comment, e.g. "DDB" or "Standalone (SQLite)".
    label: string;
    // Keys of the variant's build (or deploy) job and its test matrix job.
    buildJobKey: string;
    testsJobKey: string;
    // See createStatusRowUpdateSteps.
    urlExpression?: string;
    env?: Record<string, string>;
    /*
     * When `if` holds, the variant was skipped on purpose because the code under test doesn't
     * support it: the row says so and the job passes. `needs` is the job whose outputs `if` reads.
     */
    notSupported?: { if: string; needs: string };
}

/**
 * The last of a variant's three jobs: writes the combined result of its test matrix into the `/e2e`
 * status comment. Runs no tests. The shards can't each write it: they would race on the same row,
 * and the last one to finish would decide what it says.
 */
export const createReportStatusJob = ({
    label,
    buildJobKey,
    testsJobKey,
    urlExpression,
    env,
    notSupported
}: CreateReportStatusJobParams) => {
    const rowParams = { label, urlExpression, env };
    const supportedIf = notSupported ? `!(${notSupported.if})` : undefined;

    return createJob({
        needs: [
            "checkComment",
            ...(notSupported ? [notSupported.needs] : []),
            buildJobKey,
            testsJobKey
        ],
        name: `E2E - ${label} - Report status`,
        // Also after a failed or skipped build or shard, which is when the row most needs updating.
        if: "${{ !cancelled() && needs.checkComment.outputs.comment-id != '' }}",
        permissions: { "pull-requests": "write" },
        checkout: false,
        steps: [
            ...(notSupported
                ? [
                      createStatusRowStep(rowParams, {
                          name: `Update PR comment - ${label} not supported`,
                          condition: notSupported.if,
                          status: "⏭️ Not supported by this branch"
                      })
                  ]
                : []),
            {
                // `needs.<matrix job>.result` is `success` only if every shard passed. A failed
                // build skips the shards, which reads as `skipped` here.
                name: "Check the shards' result",
                ...(supportedIf ? { if: supportedIf } : {}),
                env: {
                    BUILD_RESULT: `\${{ needs.${buildJobKey}.result }}`,
                    TESTS_RESULT: `\${{ needs.${testsJobKey}.result }}`
                },
                run: [
                    'echo "build: $BUILD_RESULT, tests: $TESTS_RESULT"',
                    '[ "$TESTS_RESULT" = "success" ]'
                ].join("\n")
            },
            ...createStatusRowUpdateSteps({ ...rowParams, if: supportedIf })
        ]
    });
};
