import { createAbstraction } from "@webiny/feature/api";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { NotificationDetails } from "~/domain/notifications/types.js";

export interface INotificationTransportUser {
    id: string;
    email: string;
    displayName: string;
}

/**
 * The review facts a transport may show next to the text: content type (`null` when unknown),
 * content title, step number and count, step title and requester. Plain text.
 */
export type INotificationTransportMessageDetails = NotificationDetails;

/**
 * What a transport sends. `title` is the subject line, `body` the plain text, `url` the link to
 * the content or to its review details (`null` when there is none) and `linkLabel` the text of
 * that link (R190). `footer` (why the recipient gets it) and `details` are optional: a transport
 * written before they existed can ignore them.
 */
export interface INotificationTransportMessage {
    title: string;
    body: string;
    url: string | null;
    linkLabel: string;
    footer?: string;
    details?: INotificationTransportMessageDetails;
}

export interface INotificationTransportSendParams {
    users: NonEmptyArray<INotificationTransportUser>;
    message: INotificationTransportMessage;
}

export interface INotificationTransport {
    readonly id: string;
    readonly title: string;
    /** Shown next to the transport in the workflow editor (D129). */
    readonly description?: string;
    /**
     * Never throws and never fails the notification (R190, R87): the review action that caused it
     * has already been saved. A transport catches its own failures, logs each one once with
     * `Logger.error` (never the error text of a mailer or provider, which can embed addresses)
     * and returns.
     */
    send(params: INotificationTransportSendParams): Promise<void>;
}

export const NotificationTransport = createAbstraction<INotificationTransport>(
    "WorkflowNotificationTransport"
);

export namespace NotificationTransport {
    export type Interface = INotificationTransport;
    export type SendParams = INotificationTransportSendParams;
    export type User = INotificationTransportUser;
    export type Message = INotificationTransportMessage;
    export type MessageDetails = INotificationTransportMessageDetails;
}
