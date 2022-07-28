import get from "lodash/get";
import {
    AdvancedPublishingWorkflow,
    ApwContentReviewStatus,
    ApwOnBeforePagePublishTopicParams
} from "~/types";
import { INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META } from "~/crud/utils";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import { Security } from "@webiny/api-security/types";

interface UpdateContentReviewStatusParams {
    apw: AdvancedPublishingWorkflow;
    pageBuilder: PageBuilderContextObject;
    security: Security;
}

export const updateContentReviewStatus = (params: UpdateContentReviewStatusParams) => {
    const { apw, pageBuilder, security } = params;

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
            const identity = security.getIdentity();
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
