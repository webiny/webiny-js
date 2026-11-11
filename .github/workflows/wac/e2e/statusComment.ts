import type { NormalJob } from "github-actions-wac";
import { createStatusRowStep } from "./statusRowStep.js";
import type { StatusRow } from "./statusRowStep.js";

interface CreateStatusRowUpdateStepsParams extends StatusRow {
    // An expression both steps must also meet, besides their outcome.
    if?: string;
}

const updateStep = (
    params: CreateStatusRowUpdateStepsParams,
    { outcome, status }: { outcome: "success" | "failure"; status: string }
) =>
    createStatusRowStep(params, {
        id: `status-row-${outcome}`,
        name: `Update PR comment - ${params.label} ${outcome === "success" ? "passed" : "failed"}`,
        condition: params.if ? `${outcome}() && ${params.if}` : `${outcome}()`,
        status
    });

/**
 * The pair of steps that write a variant's final result into the `/e2e` status comment.
 *
 * Every variant reports both outcomes. Previously only the AWS rows were updated, and only on the
 * way through - they flipped to "✅ Ready" once the deploy succeeded and then never changed again,
 * so a failed test run left the comment claiming the variant was fine.
 */
export const createStatusRowUpdateSteps = (
    params: CreateStatusRowUpdateStepsParams
): NonNullable<NormalJob["steps"]> => [
    updateStep(params, { outcome: "success", status: "✅ Passed" }),
    updateStep(params, { outcome: "failure", status: "❌ Failed" })
];
