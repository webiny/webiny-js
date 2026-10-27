import type { Review } from "~/review/domain/types.js";
import { isStepRunning } from "../targetReview/isStepRunning.js";
import type { ReviewActionDialogContext } from "./ReviewActionDialogContext.js";

const EDITOR_BODY =
    "Review progress is lost. Editing is unlocked, and a new request starts again from the first step.";
const LIST_BODY =
    "review progress is lost. Editing is unlocked, and a new request starts again from the first step.";

/*
 * The body of the cancel dialog (QBZ-51): the 8a text, with the design's suffix when the current
 * step is running and will be stopped (design 4c, frame 23). The list names the review, as it has
 * no content in view. Pure.
 */
export const getCancelDialogBody = (review: Review, context: ReviewActionDialogContext): string => {
    let body = EDITOR_BODY;
    if (context === "list") {
        body = `“${review.title}”: ${LIST_BODY}`;
    }
    const current = review.steps.find(step => step.id === review.currentStepId);
    if (current && isStepRunning(current)) {
        return `${body} ${current.title} is running and will be stopped.`;
    }
    return body;
};
