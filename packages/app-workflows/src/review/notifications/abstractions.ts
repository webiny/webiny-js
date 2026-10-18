import { createAbstraction } from "@webiny/feature/admin";

export type WorkflowsNotificationEvent =
    | "poolReached"
    | "assigned"
    | "reassigned"
    | "takenOver"
    | "approved"
    | "rejected"
    | "failed"
    | "cancelled";

// The data of a `workflows.notification` websocket message (phase 7 contract, R187).
export interface WorkflowsNotificationData {
    event: WorkflowsNotificationEvent;
    reviewId: string;
    stepId: string | null;
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    body: string;
}

export type WorkflowReviewChangedKind =
    | "requested"
    | "stepStarted"
    | "stepApproved"
    | "stepRestarted";

// The data of a `workflows.reviewChanged` websocket message (R253): ids and namespace only.
export interface WorkflowReviewChangedData {
    kind: WorkflowReviewChangedKind;
    reviewId: string;
    stepId: string | null;
    namespace: string;
    targetId: string;
    targetRevisionId: string;
}

export interface HandleReviewNotificationParams {
    data: WorkflowsNotificationData;
    // The content URL for the "Open content" link; `null` when the app cannot build one.
    url: string | null;
}

export interface IReviewNotificationService {
    handle(params: HandleReviewNotificationParams): void;
}

export const ReviewNotificationService = createAbstraction<IReviewNotificationService>(
    "Workflows/ReviewNotificationService"
);

export namespace ReviewNotificationService {
    export type Interface = IReviewNotificationService;
    export type Params = HandleReviewNotificationParams;
}
