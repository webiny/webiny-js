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
 * Where the transport link of a message points: the content, or the content with the review's
 * details open (`&reviewId=`).
 */
export type NotificationLink = "content" | "reviewDetails";

/**
 * One notification's texts (R189). `title` and `body` are the websocket (in-app) texts;
 * `subject`, `text`, `linkLabel` and `footer` go to the transports (`subject` is the transport
 * message `title`, `text` its `body`). `link` picks the URL the transports get. Plain text:
 * escaping is the transport's job.
 */
export interface NotificationMessage {
    title: string;
    body: string;
    subject: string;
    text: string;
    linkLabel: string;
    link: NotificationLink;
    /** Why the recipient gets the message (one line, the e-mail footer). */
    footer: string;
}

/**
 * The facts of a review a transport may show next to the text (the e-mail's details table). Plain
 * text: escaping is the transport's job.
 */
export interface NotificationDetails {
    /** The content type's name ("Article", "Page"); `null` for reviews requested before it was kept. */
    contentType: string | null;
    contentTitle: string;
    /** The step's position, from 1. */
    stepNumber: number;
    stepCount: number;
    stepTitle: string;
    /** The requester's name (`getActorName`). */
    requester: string;
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
    /** Where the toast's action opens and its text: the same choice the e-mail gets. */
    link: NotificationLink;
    linkLabel: string;
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
