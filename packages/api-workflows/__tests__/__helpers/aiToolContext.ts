import type { StepRunTaskIdentity } from "~/domain/review/getStaleStepRunReason.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";
import { AUTOMATION_STEP_ID, createRunningAutomationReview } from "./stepRunReviews.js";
import { requester, toSaveData } from "./fixtures.js";

/** The task id the running test review carries, created by the requester (R148, R149). */
export const AI_TOOL_TASK: StepRunTaskIdentity = { id: "task-1", createdById: requester.id };

/**
 * What the AI runner hands a tool: the stored running review "review-1" (model "cms.article",
 * target "article-1", revision "article-1#0001"), its current step and the task that runs it.
 * Save `context.review` with `ReviewRepository.save` to make the stored review match.
 */
export const createAiToolContext = (): WorkflowAiTool.Context => {
    const review = toSaveData(createRunningAutomationReview());
    const step = review.steps.find(candidate => candidate.id === AUTOMATION_STEP_ID);
    if (!step) {
        throw new Error("The test review has no step to run.");
    }
    return { review, step, requester, task: AI_TOOL_TASK };
};
