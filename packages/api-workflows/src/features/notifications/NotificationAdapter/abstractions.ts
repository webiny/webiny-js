import { createAbstraction } from "@webiny/feature/api";
import type { INotificationTypeMessages } from "~/domain/notifications/abstractions.js";
import type { NonEmptyArray } from "@webiny/api/types.js";

export interface INotificationAdapterUser {
    id: string;
    email: string;
    displayName: string;
}

export interface INotificationAdapterMessage {
    type: keyof INotificationTypeMessages;
    title: string;
    url: string;
    body: string;
}

export interface INotificationAdapterSendParams {
    users: NonEmptyArray<INotificationAdapterUser>;
    message: INotificationAdapterMessage;
}

export interface INotificationAdapter {
    id: string;
    title: string;
    send(params: INotificationAdapterSendParams): Promise<void>;
}

export const NotificationAdapter = createAbstraction<INotificationAdapter>(
    "WorkflowNotificationAdapter"
);

export namespace NotificationAdapter {
    export type Interface = INotificationAdapter;
    export type SendParams = INotificationAdapterSendParams;
}
