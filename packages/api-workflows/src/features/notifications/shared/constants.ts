/** The websocket action of every workflow notification (R187); the event is in `data`. */
export const WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION = "workflows.notification";

/**
 * The websocket action of the silent review change message (R253): ids and the namespace only,
 * no text and no toast; the kind is in `data`.
 */
export const WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION = "workflows.reviewChanged";

/** Recipients whose websocket send runs at the same time, in plain batches (R197). */
export const NOTIFICATION_SEND_CONCURRENCY = 10;

/** The most recipients in one e-mail's `bcc` (R193). */
export const MAIL_BCC_CHUNK_SIZE = 50;
