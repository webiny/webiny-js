import { createAbstraction } from "@webiny/feature/api";
import type {
    INotificationType,
    INotificationTypeMessage
} from "~/domain/notifications/abstractions.js";
import type { NonEmptyArray } from "@webiny/api/types.js";

export interface INotificationTransportUser {
    id: string;
    email: string;
    displayName: string;
}

export interface INotificationTransportSendParams {
    users: NonEmptyArray<INotificationTransportUser>;
    message: INotificationTypeMessage;
}

export interface INotificationTransport {
    id: INotificationType["id"];
    title: INotificationType["title"];
    send(params: INotificationTransportSendParams): Promise<void>;
}

export const NotificationTransport = createAbstraction<INotificationTransport>(
    "WorkflowNotificationTransport"
);

export namespace NotificationTransport {
    export type Interface = INotificationTransport;
    export type SendParams = INotificationTransportSendParams;
}
