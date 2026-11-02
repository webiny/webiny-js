import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";
import { ReviewNotificationService as Abstraction } from "./abstractions.js";
import type { HandleReviewNotificationParams } from "./abstractions.js";

const OPEN_CONTENT_LABEL = "Open content";

/*
 * Turns one incoming `workflows.notification` message into a toast and a refetch signal (R223,
 * R210). It knows no app: the caller passes the content URL.
 */
class ReviewNotificationServiceImpl implements Abstraction.Interface {
    constructor(
        private notifications: Notifications.Interface,
        private activity: ReviewActivity.Interface
    ) {}

    handle(params: HandleReviewNotificationParams): void {
        const { data, url } = params;
        const input: INotificationInput = {
            title: data.title,
            description: data.body,
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        };
        if (url) {
            input.link = { label: OPEN_CONTENT_LABEL, url };
        }
        this.notifications.notify(input);
        this.activity.notify({
            namespace: data.namespace,
            source: "remote",
            reviewId: data.reviewId,
            targetRevisionId: data.targetRevisionId
        });
    }
}

export const ReviewNotificationService = Abstraction.createImplementation({
    implementation: ReviewNotificationServiceImpl,
    dependencies: [Notifications, ReviewActivity]
});
