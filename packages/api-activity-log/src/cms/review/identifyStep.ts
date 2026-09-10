import type { ActivityReviewAction, ActivitySubject } from "~/core/types.js";

/** Only the parts of a workflow step this needs, so the logic is testable without APW. */
export interface StepLike {
    id: string;
    title: string;
    state: string;
    /** The reviewer's note. Read only to record *whether* one exists — never stored. */
    comment?: string | null;
}

/**
 * Which step an action concerned, derived from the state *after* the action.
 *
 * The action events carry `{ state }` and no `original`, and none of them names the step. It has
 * to be derived — which is safe because APW constrains the shape tightly:
 *
 *   - `getActiveStep()` returns the *first* step in `inReview`, and approve, reject and take-over
 *     all operate on it, so at most one step is ever `inReview`.
 *   - `start()` moves the pending step to `inReview`.
 *   - `reject()` puts exactly one step into `rejected`, and `getActiveStep()` then returns null,
 *     so no further step can transition.
 *   - Approvals therefore happen strictly in order, which makes the *last* approved step the one
 *     just approved.
 *
 * Returns null when no step can be identified, which the caller reports rather than guesses at.
 */
export const identifyStep = <T extends StepLike>(
    action: ActivityReviewAction,
    steps: T[]
): T | null => {
    const found = (step: T | undefined): T | null => step ?? null;

    switch (action) {
        case "review.step.approved":
            // Approvals are in order, so the highest-index approved step is the newest one.
            return found(steps.filter(step => step.state === "approved").at(-1));

        case "review.step.rejected":
            // At most one step is ever rejected: the state stops accepting transitions after.
            return found(steps.find(step => step.state === "rejected"));

        case "review.step.started":
        case "review.step.takenOver":
            // Both leave the step in review — take-over changes only who owns it.
            return found(steps.find(step => step.state === "inReview"));

        default:
            // Submission, cancellation, deletion and the terminal record states are about the
            // review as a whole, not about one step.
            return null;
    }
};

/** The step rendered for the record: its identity and its label, captured now. */
export const toSubject = (step: StepLike): ActivitySubject => ({
    id: step.id,
    label: step.title
});

/** Whether the reviewer attached a note. The note itself never leaves APW. */
export const hasNote = (step: StepLike): boolean => {
    return typeof step.comment === "string" && step.comment.trim() !== "";
};
