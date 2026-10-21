import { createAbstraction } from "@webiny/feature/admin";

export type ReviewToastKind =
    | "requested"
    | "started"
    | "restarted"
    | "tookOver"
    | "reassigned"
    | "approved"
    | "rejected"
    | "cancelled";

interface ReviewToastBase {
    /*
     * The Content Reviews URL for the "Open Content Reviews" link; `null` on Content Reviews
     * itself.
     */
    reviewsUrl: string | null;
}

// `requested` (the first step of the workflow), `started`, `restarted` and `rejected` name one step.
export interface StepReviewToastParams extends ReviewToastBase {
    kind: "requested" | "started" | "restarted" | "rejected";
    stepTitle: string;
    personName: null;
}

// `approved` names the step and the step that is next, `null` when it was the last step.
export interface ApprovedReviewToastParams extends ReviewToastBase {
    kind: "approved";
    stepTitle: string;
    personName: null;
    nextStepTitle: string | null;
}

// `tookOver` names the person notified, `null` when notify was not ticked.
export interface TookOverReviewToastParams extends ReviewToastBase {
    kind: "tookOver";
    stepTitle: string;
    personName: string | null;
}

// `reassigned` always names the new owner.
export interface ReassignedReviewToastParams extends ReviewToastBase {
    kind: "reassigned";
    stepTitle: string;
    personName: string;
}

export interface CancelledReviewToastParams extends ReviewToastBase {
    kind: "cancelled";
    stepTitle: null;
    personName: null;
}

export type ReviewToastParams =
    | StepReviewToastParams
    | ApprovedReviewToastParams
    | TookOverReviewToastParams
    | ReassignedReviewToastParams
    | CancelledReviewToastParams;

export interface IReviewToasts {
    show(params: ReviewToastParams): void;
}

export const ReviewToasts = createAbstraction<IReviewToasts>("Workflows/ReviewToasts");

export namespace ReviewToasts {
    export type Interface = IReviewToasts;
    export type Params = ReviewToastParams;
}
