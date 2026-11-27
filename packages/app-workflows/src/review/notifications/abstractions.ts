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

export type WorkflowsNotificationLink = "content" | "reviewDetails";

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
    // What the toast's action opens and says. Optional: a message without it gets "Open content".
    link?: WorkflowsNotificationLink;
    linkLabel?: string;
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
    // The content URL; the toast link is this URL or, for `reviewDetails`, this URL with `reviewId`; `null` when the app cannot build one.
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
