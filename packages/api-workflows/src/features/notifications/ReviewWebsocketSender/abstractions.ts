import { createAbstraction } from "@webiny/feature/api";

export interface ReviewWebsocketSendParams {
    /** The review the frame is about: a log field only. */
    reviewId: string;
    /** A name for the frame (a notification event or a change kind): a log field only. */
    event: string;
    /** Duplicates and empty ids are dropped; no id left means nothing is sent. */
    recipientIds: string[];
    /** The websocket action of the frame. */
    action: string;
    /** The `data` of the frame, the same for every recipient. */
    data: object;
}

export interface IReviewWebsocketSender {
    /**
     * Sends one `{ action, data }` frame to every connection of every recipient in the current
     * tenant (D149, R188, A63). Recipients are handled in batches of
     * `NOTIFICATION_SEND_CONCURRENCY` (R197). Never rejects and never reports a failure (R87,
     * R196): every failure is logged once and the rest still goes out.
     */
    send(params: ReviewWebsocketSendParams): Promise<void>;
}

/** Sends one review websocket frame. Internal (D132): no permission check. */
export const ReviewWebsocketSender = createAbstraction<IReviewWebsocketSender>(
    "Workflows/ReviewWebsocketSender"
);

export namespace ReviewWebsocketSender {
    export type Interface = IReviewWebsocketSender;
    export type SendParams = ReviewWebsocketSendParams;
}
