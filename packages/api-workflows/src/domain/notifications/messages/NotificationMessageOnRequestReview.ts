import {
    type INotificationMessageBodyParams,
    type INotificationMessageTitleParams,
    type INotificationMessageUrlParams,
    NotificationReviewRequestMessage as NotificationMessage
} from "~/domain/notifications/abstractions.js";

class NotificationReviewRequestMessageImpl implements NotificationMessage.Interface {
    public getBody(params: INotificationMessageBodyParams): string {
        return "";
    }

    public getTitle(params: INotificationMessageTitleParams): string {
        return "";
    }

    public getUrl(params: INotificationMessageUrlParams): string {
        return "";
    }
}

export const NotificationReviewRequestMessage = NotificationMessage.createImplementation({
    implementation: NotificationReviewRequestMessageImpl,
    dependencies: []
});
