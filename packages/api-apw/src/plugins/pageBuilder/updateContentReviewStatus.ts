import get from "lodash/get";
import { ApwContentReviewStatus, ApwOnBeforePagePublishTopicParams } from "~/types";
import { InitiateContentReviewParams } from ".";
import { INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META } from "~/createApw/utils";

export const updateContentReviewStatus = ({
    pageBuilder,
    apw,
    getIdentity
}: InitiateContentReviewParams) => {
    pageBuilder.onAfterPagePublish.subscribe<ApwOnBeforePagePublishTopicParams>(
        async ({ page }) => {
            const contentReviewId = get(page, "settings.apw.contentReviewId");
            /**
             * Bail out if there is no "content review" linked.
             */
            if (!contentReviewId) {
                return;
            }

            const contentReview = await apw.contentReview.get(contentReviewId);
            const identity = getIdentity();
            /**
             * If content review is "readyToBePublished set its status as "published" after page publish.
             */
            if (contentReview.status === ApwContentReviewStatus.READY_TO_BE_PUBLISHED) {
                await apw.contentReview.update(contentReviewId, {
                    status: ApwContentReviewStatus.PUBLISHED,
                    content: {
                        ...contentReview.content,
                        ...INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META,
                        publishedBy: identity.id
                    }
                });
            }
        }
    );
    pageBuilder.onAfterPageUnpublish.subscribe<ApwOnBeforePagePublishTopicParams>(
        async ({ page }) => {
            const contentReviewId = get(page, "settings.apw.contentReviewId");
            /**
             * Bail out if there is no "content review" linked.
             */
            if (!contentReviewId) {
                return;
            }

            const contentReview = await apw.contentReview.get(contentReviewId);
            /**
             * If content review is "published set its status as "readyToBePublished" after page unpublish.
             */

            if (contentReview.status === ApwContentReviewStatus.PUBLISHED) {
                await apw.contentReview.update(contentReviewId, {
                    status: ApwContentReviewStatus.READY_TO_BE_PUBLISHED,
                    content: {
                        ...contentReview.content,
                        ...INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META,
                        publishedBy: null
                    }
                });
            }
        }
    );
};
