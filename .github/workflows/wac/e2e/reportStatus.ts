import type { NormalJob } from "github-actions-wac";
import { createJob } from "../jobs/index.js";
import { createStatusRowUpdateSteps } from "./statusComment.js";
import { createStatusRowStep } from "./statusRowStep.js";
import type { PrFeature } from "./prFeature.js";

type JobStep = NonNullable<NormalJob["steps"]>[number];

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
     * The feature the variant needs from the PR's code. When the PR's code lacks it, the variant
     * was skipped on purpose: the row says so and the job passes.
     */
    feature?: PrFeature;
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
    feature
}: CreateReportStatusJobParams) => {
    const row = { label, urlExpression, env };
    const needs = ["checkComment", buildJobKey, testsJobKey];
    const steps: JobStep[] = [];

    const checkResultStep: JobStep = {
        // `needs.<matrix job>.result` is `success` only if every shard passed. A failed
        // build skips the shards, which reads as `skipped` here.
        name: "Check the shards' result",
        env: {
            BUILD_RESULT: `\${{ needs.${buildJobKey}.result }}`,
            TESTS_RESULT: `\${{ needs.${testsJobKey}.result }}`
        },
        run: [
            'echo "build: $BUILD_RESULT, tests: $TESTS_RESULT"',
            '[ "$TESTS_RESULT" = "success" ]'
        ].join("\n")
    };

    if (!feature) {
        steps.push(checkResultStep, ...createStatusRowUpdateSteps(row));
    } else {
        /*
         * `!lacks` rather than `has`, so a run where the feature check itself failed (empty
         * output) still reports the variant as failed.
         */
        const notSkippedOnPurpose = `!(${feature.lacks})`;
        needs.push(feature.needs);
        steps.push(
            createStatusRowStep(row, {
                name: `Update PR comment - ${label} not supported`,
                condition: feature.lacks,
                status: "⏭️ Not supported by this branch"
            }),
            { ...checkResultStep, if: notSkippedOnPurpose },
            ...createStatusRowUpdateSteps({ ...row, if: notSkippedOnPurpose })
        );
    }

    return createJob({
        needs,
        name: `E2E - ${label} - Report status`,
        // Also after a failed or skipped build or shard, which is when the row most needs updating.
        if: "${{ !cancelled() && needs.checkComment.outputs.comment-id != '' }}",
        permissions: { "pull-requests": "write" },
        checkout: false,
        steps
    });
};
