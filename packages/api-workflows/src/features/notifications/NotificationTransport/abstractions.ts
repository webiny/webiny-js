import { createAbstraction } from "@webiny/feature/api";
import type { NonEmptyArray } from "@webiny/api/types.js";

export interface INotificationTransportUser {
    id: string;
    email: string;
    displayName: string;
}

/**
 * What a transport sends. `title` is the subject line, `body` the plain text, `url` the link to
 * the content (`null` when there is none) and `linkLabel` the text of that link (R190).
 */
export interface INotificationTransportMessage {
    title: string;
    body: string;
    url: string | null;
    linkLabel: string;
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
}
