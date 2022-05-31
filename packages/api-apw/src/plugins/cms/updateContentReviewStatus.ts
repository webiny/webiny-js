import {
    AdvancedPublishingWorkflow,
    ApwContentReviewStatus,
    OnAfterCmsEntryPublishTopicParams,
    OnAfterCmsEntryUnpublishTopicParams
} from "~/types";
import { INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META } from "~/createApw/utils";
import { HeadlessCms } from "@webiny/api-headless-cms/types";
import { SecurityIdentity } from "@webiny/api-security/types";

interface UpdateContentReviewStatusParams {
    apw: AdvancedPublishingWorkflow;
    cms: HeadlessCms;
    getIdentity: () => SecurityIdentity;
}

export const updateContentReviewStatus = (params: UpdateContentReviewStatusParams) => {
    const { apw, cms, getIdentity } = params;

    cms.onAfterEntryPublish.subscribe<OnAfterCmsEntryPublishTopicParams>(async ({ entry }) => {
        const contentReviewId = entry.meta?.apw?.contentReviewId;
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
        if (contentReview.status !== ApwContentReviewStatus.READY_TO_BE_PUBLISHED) {
            return;
        }
        await apw.contentReview.update(contentReviewId, {
            status: ApwContentReviewStatus.PUBLISHED,
            content: {
                ...contentReview.content,
                ...INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META,
                publishedBy: identity.id
            }
        });
    });
    cms.onAfterEntryUnpublish.subscribe<OnAfterCmsEntryUnpublishTopicParams>(async ({ entry }) => {
        const contentReviewId = entry.meta?.apw?.contentReviewId;
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

        if (contentReview.status !== ApwContentReviewStatus.PUBLISHED) {
            return;
        }
        await apw.contentReview.update(contentReviewId, {
            status: ApwContentReviewStatus.READY_TO_BE_PUBLISHED,
            content: {
                ...contentReview.content,
                ...INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META,
                publishedBy: null
            }
        });
    });
};
