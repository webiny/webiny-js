import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewToasts as Abstraction } from "./abstractions.js";
import type { ReviewToastParams } from "./abstractions.js";
import { getReviewToastText } from "./getReviewToastText.js";
import { REVIEW_TOAST_DURATION } from "./constants.js";
import { REVIEW_TOAST_LINK_LABEL } from "./constants.js";
import { REVIEW_TOAST_POSITION } from "./constants.js";

class ReviewToastsImpl implements Abstraction.Interface {
    constructor(private notifications: Notifications.Interface) {}

    show(params: ReviewToastParams): void {
        const text = getReviewToastText(params);
        const input: INotificationInput = {
            title: text.title,
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        };
        if (text.description !== null) {
            input.description = text.description;
        }
        if (params.reviewsUrl) {
            input.link = { label: REVIEW_TOAST_LINK_LABEL, url: params.reviewsUrl };
        }
        this.notifications.success(input);
    }
}

export const ReviewToasts = Abstraction.createImplementation({
    implementation: ReviewToastsImpl,
    dependencies: [Notifications]
});
