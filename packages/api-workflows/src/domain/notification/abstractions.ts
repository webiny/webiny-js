import { createAbstraction } from "@webiny/feature/api";
import type { NonEmptyArray } from "@webiny/api/types.js";

/**
 * Notification Message
 */
export interface INotificationMessageTitleParams {
    id: string;
    entryTitle: string;
}

export interface INotificationMessageBodyParams {
    id: string;
    entryTitle: string;
}

export interface INotificationMessageUrlParams {
    id: string;
    entryTitle: string;
}

export interface INotificationMessage {
    getTitle(params: INotificationMessageTitleParams): string;
    getBody(params: INotificationMessageBodyParams): string;
    getUrl(params: INotificationMessageUrlParams): string;
}

export const NotificationReviewRequestMessage = createAbstraction<INotificationMessage>(
    "WorkflowNotificationReviewRequestMessage"
);

export namespace NotificationReviewRequestMessage {
    export type Interface = INotificationMessage;
}

export const NotificationReviewCancelMessage = createAbstraction<INotificationMessage>(
    "WorkflowNotificationReviewCancelMessage"
);

export namespace NotificationReviewCancelMessage {
    export type Interface = INotificationMessage;
}

export const NotificationReviewStepStartMessage = createAbstraction<INotificationMessage>(
    "WorkflowNotificationReviewStepStartMessage"
);

export namespace NotificationReviewStepStartMessage {
    export type Interface = INotificationMessage;
}

export const NotificationReviewStepApproveMessage = createAbstraction<INotificationMessage>(
    "WorkflowNotificationReviewStepApproveMessage"
);

export namespace NotificationReviewStepApproveMessage {
    export type Interface = INotificationMessage;
}

export const NotificationReviewRejectMessage = createAbstraction<INotificationMessage>(
    "WorkflowNotificationReviewRejectMessage"
);

export namespace NotificationReviewRejectMessage {
    export type Interface = INotificationMessage;
}

export const NotificationReviewApproveMessage = createAbstraction<INotificationMessage>(
    "WorkflowNotificationReviewApproveMessage"
);

export namespace NotificationReviewApproveMessage {
    export type Interface = INotificationMessage;
}

export type INotificationMessages =
    | NotificationReviewRequestMessage.Interface
    | NotificationReviewCancelMessage.Interface
    | NotificationReviewStepStartMessage.Interface
    | NotificationReviewStepApproveMessage.Interface
    | NotificationReviewRejectMessage.Interface
    | NotificationReviewApproveMessage.Interface;


export interface INotificationTypeMessages {
    /**
     * User requests a review for a content.
     */
    reviewRequest: NotificationReviewRequestMessage.Interface;
    /**
     * User cancels a review for a content.
     */
    reviewCancel: NotificationReviewCancelMessage.Interface;
    /**
     * Reviewer starts a review step.
     */
    reviewStepStart: NotificationReviewStepStartMessage.Interface;
    /**
     * Reviewer approves a review step - there are more steps after this one.
     */
    reviewStepApprove: NotificationReviewStepApproveMessage.Interface;
    /**
     * Reviewer rejects a review - no step specific reject because as soon as step is rejected, whole review is rejected.
     */
    reviewReject: NotificationReviewRejectMessage.Interface;
    /**
     * Reviewer approves a final review step.
     */
    reviewApprove: NotificationReviewApproveMessage.Interface;
}

/**
 * Notification Type
 */
export interface INotificationType {
    id: string;
    title: string;
}

export const NotificationType = createAbstraction<INotificationType>("WorkflowNotificationType");

export namespace NotificationType {
    export type Interface = INotificationType;
}

/**
 * Notification Message Body Converter
 */
export interface INotificationMessageBodyConverter {
    convert(body: string): string;
}

export const NotificationMessageBodyConverter =
    createAbstraction<INotificationMessageBodyConverter>("NotificationMessageBodyConverter");

export namespace NotificationMessageBodyConverter {
    export type Interface = INotificationMessageBodyConverter;
}

/**
 * Notification Adapter
 */
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
    getMessageBodyConverter(): NotificationMessageBodyConverter.Interface | null;
    send(params: INotificationAdapterSendParams): Promise<void>;
}

export const NotificationAdapter = createAbstraction<INotificationAdapter>(
    "WorkflowNotificationAdapter"
);

export namespace NotificationAdapter {
    export type Interface = INotificationAdapter;
    export type SendParams = INotificationAdapterSendParams;
}


export namespace Notification {
    export type Type = INotificationType;
    export type Adapter = INotificationAdapter;
    export type MessageBodyConverter = INotificationMessageBodyConverter;
}
