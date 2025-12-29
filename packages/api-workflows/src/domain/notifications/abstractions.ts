import { createAbstraction } from "@webiny/feature/createAbstraction.js";

export interface INotificationTypeMessage {
    title: string;
    body: string;
    url: string;
}

export const NotificationTypeMessageOnRequestReview = createAbstraction<INotificationTypeMessage>(
    "WorkflowNotificationTypeMessageOnRequestReview"
);

export namespace NotificationTypeMessageOnRequestReview {
    export type Interface = INotificationTypeMessage;
}

export const NotificationTypeMessageOnRequestReviewCancel =
    createAbstraction<INotificationTypeMessage>(
        "WorkflowNotificationTypeMessageOnRequestReviewCancel"
    );

export namespace NotificationTypeMessageOnRequestReviewCancel {
    export type Interface = INotificationTypeMessage;
}

export const NotificationTypeMessageOnReviewStepStart = createAbstraction<INotificationTypeMessage>(
    "WorkflowNotificationTypeMessageOnReviewStepStart"
);

export namespace NotificationTypeMessageOnReviewStepStart {
    export type Interface = INotificationTypeMessage;
}

export const NotificationTypeMessageOnReviewStepApprove =
    createAbstraction<INotificationTypeMessage>(
        "WorkflowNotificationTypeMessageOnReviewStepApprove"
    );

export namespace NotificationTypeMessageOnReviewStepApprove {
    export type Interface = INotificationTypeMessage;
}

export const NotificationTypeMessageOnReviewReject = createAbstraction<INotificationTypeMessage>(
    "WorkflowNotificationTypeMessageOnReviewReject"
);

export namespace NotificationTypeMessageOnReviewReject {
    export type Interface = INotificationTypeMessage;
}

export const NotificationTypeMessageOnReviewApprove = createAbstraction<INotificationTypeMessage>(
    "WorkflowNotificationTypeMessageOnReviewApprove"
);

export namespace NotificationTypeMessageOnReviewApprove {
    export type Interface = INotificationTypeMessage;
}

export type INotificationTypes =
    | NotificationTypeMessageOnRequestReview.Interface
    | NotificationTypeMessageOnRequestReviewCancel.Interface
    | NotificationTypeMessageOnReviewStepStart.Interface
    | NotificationTypeMessageOnReviewStepApprove.Interface
    | NotificationTypeMessageOnReviewReject.Interface
    | NotificationTypeMessageOnReviewApprove.Interface;

export interface INotificationTypeMessages {
    /**
     * User requests a review for a content.
     */
    onRequestReview: NotificationTypeMessageOnRequestReview.Interface;
    /**
     * User cancels a review for a content.
     */
    onRequestReviewCancel: NotificationTypeMessageOnRequestReviewCancel.Interface;
    /**
     * Reviewer starts a review step.
     */
    onReviewStepStart: NotificationTypeMessageOnReviewStepStart.Interface;
    /**
     * Reviewer approves a review step - there are more steps after this one.
     */
    onReviewStepApprove: NotificationTypeMessageOnReviewStepApprove.Interface;
    /**
     * Reviewer rejects a review - no step specific reject because as soon as step is rejected, whole review is rejected.
     */
    onReviewReject: NotificationTypeMessageOnReviewReject.Interface;
    /**
     * Reviewer approves a final review step.
     */
    onReviewApprove: NotificationTypeMessageOnReviewApprove.Interface;
}

export interface INotificationType {
    id: string;
    title: string;
    messages: INotificationTypeMessages;
}

export const NotificationType = createAbstraction<INotificationType>("WorkflowNotificationType");

export namespace NotificationType {
    export type Interface = INotificationType;
}
