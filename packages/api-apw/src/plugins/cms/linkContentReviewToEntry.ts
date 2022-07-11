import { AdvancedPublishingWorkflow, ApwContentTypes } from "~/types";
import { fetchModel, isAwpModel, updateEntryMeta } from "~/plugins/cms/utils";
import Error from "@webiny/error";
import { HeadlessCms } from "@webiny/api-headless-cms/types";

interface LinkContentReviewToEntryParams {
    apw: AdvancedPublishingWorkflow;
    cms: HeadlessCms;
}
export const linkContentReviewToEntry = (params: LinkContentReviewToEntryParams) => {
    const { apw, cms } = params;

    apw.contentReview.onAfterContentReviewCreate.subscribe(async ({ contentReview }) => {
        const { content } = contentReview;

        if (content.type !== ApwContentTypes.CMS_ENTRY) {
            return;
        }

        const model = await fetchModel(cms, content.id, content.settings);

        await updateEntryMeta({
            cms,
            model,
            meta: {
                apw: {
                    contentReviewId: contentReview.id
                }
            },
            entryId: content.id
        });
    });

    apw.contentReview.onAfterContentReviewDelete.subscribe(async ({ contentReview }) => {
        const { content } = contentReview;
        if (content.type !== ApwContentTypes.CMS_ENTRY) {
            return;
        }

        const model = await fetchModel(cms, content.id, content.settings);

        await updateEntryMeta({
            cms,
            model,
            meta: {
                apw: {
                    contentReviewId: null
                }
            },
            entryId: content.id
        });
    });

    cms.onBeforeEntryDelete.subscribe(async ({ entry, model }) => {
        if (isAwpModel(model)) {
            return;
        }
        const contentReviewId = entry.meta?.apw?.contentReviewId;

        if (!contentReviewId) {
            return;
        }
        let contentReview;
        try {
            contentReview = await apw.contentReview.get(contentReviewId);
        } catch (ex) {
            /**
             * We're handling the case whereby "contentReviewId" is still linked to page;
             * even when the contentReview entry has been deleted. In that case, we'll allow page deletion.
             */
            if (ex.code !== "NOT_FOUND") {
                throw ex;
            }
        }

        if (!contentReview) {
            return;
        }
        throw new Error(
            `Cannot delete the entry because a peer review has been requested. Please delete the review first.`,
            "CANNOT_DELETE_REVIEW_EXIST",
            {
                contentReviewId,
                entry
            }
        );
    });
};
