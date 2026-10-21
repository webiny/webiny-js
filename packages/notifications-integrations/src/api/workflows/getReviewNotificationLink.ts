import { APP_HEADLESS_CMS } from "~/shared/constants.js";

export interface ReviewNotificationLinkSource {
    /** The review's namespace, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
}

export interface ReviewNotificationLink {
    app: string;
    contentId: string;
}

/*
 * A CMS entry link carries "<modelId>:<entryId>", which the inbox opens. Any other app keeps its
 * namespace prefix as the app and the bare target id; the inbox does not open those yet.
 */
export const getReviewNotificationLink = (
    review: ReviewNotificationLinkSource
): ReviewNotificationLink => {
    const [app, ...rest] = review.model.split(".");
    const modelId = rest.join(".");
    if (app === APP_HEADLESS_CMS && modelId) {
        return { app, contentId: `${modelId}:${review.targetId}` };
    }
    return { app, contentId: review.targetId };
};
