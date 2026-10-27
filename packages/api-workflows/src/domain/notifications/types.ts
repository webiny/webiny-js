/**
 * One registered notification transport, as the transports operation lists it (D129, R191).
 * `description` is `null` when the transport has none.
 */
export interface NotificationTransportInfo {
    id: string;
    title: string;
    description: string | null;
}

/**
 * The events a recipient is told about (R187). Not the review fact names: `poolReached` and
 * `assigned` are the two shapes of `stepReached`.
 */
export type WorkflowNotificationEvent =
    | "poolReached"
    | "assigned"
    | "reassigned"
    | "takenOver"
    | "approved"
    | "rejected"
    | "failed"
    | "cancelled";

/**
 * One notification's texts (R189). `title` and `body` are the websocket (in-app) texts;
 * `subject`, `text` and `linkLabel` go to the transports (`subject` is the transport message
 * `title`, `text` its `body`). Plain text: escaping is the transport's job.
 */
export interface NotificationMessage {
    title: string;
    body: string;
    subject: string;
    text: string;
    linkLabel: string;
}

/**
 * The `data` of the `workflows.notification` websocket action (R187). Ids, the namespace and the
 * in-app texts only (R200); `stepId` is `null` only for a cancel with no step, which notifies
 * nobody.
 */
export interface WorkflowNotificationWebsocketData {
    event: WorkflowNotificationEvent;
    reviewId: string;
    stepId: string | null;
    /** `review.model`: the client opens the CMS or Website Builder app by it (D133). */
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    body: string;
}

/** What changed in a review, as the silent change message names it (R253). */
export type WorkflowReviewChangedKind =
    | "requested"
    | "stepStarted"
    | "stepApproved"
    | "stepRestarted";

/**
 * The `data` of the `workflows.reviewChanged` websocket action (R253). Ids and the namespace
 * only (R200): the client refetches what shows the review. `stepId` is the step the change is
 * about, `null` when the review has none.
 */
export interface WorkflowReviewChangedWebsocketData {
    kind: WorkflowReviewChangedKind;
    reviewId: string;
    stepId: string | null;
    /** `review.model`: the client opens the CMS or Website Builder app by it (D133). */
    namespace: string;
    targetId: string;
    targetRevisionId: string;
}
