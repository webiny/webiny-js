import Error from "@webiny/error";
import { AdvancedPublishingWorkflow, ApwContentTypes } from "~/types";
import { updatePageSettings } from "./utils";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";

interface LinkContentReviewToPageParams {
    apw: AdvancedPublishingWorkflow;
    pageBuilder: PageBuilderContextObject;
}

export const linkContentReviewToPage = (params: LinkContentReviewToPageParams) => {
    const { apw, pageBuilder } = params;

    apw.contentReview.onContentReviewAfterCreate.subscribe(async ({ contentReview }) => {
        const { content } = contentReview;

        if (content.type !== ApwContentTypes.PAGE) {
            return;
        }
        await updatePageSettings({
            getPage: pageBuilder.getPage,
            updatePage: pageBuilder.updatePage,
            uniquePageId: content.id,
            getNewSettings: settings => {
                return {
                    ...settings,
                    apw: {
                        ...(settings.apw || {}),
                        contentReviewId: contentReview.id
                    }
                };
            }
        });
    });

    apw.contentReview.onContentReviewAfterDelete.subscribe(async ({ contentReview }) => {
        const { content } = contentReview;

        if (content.type !== ApwContentTypes.PAGE) {
            return;
        }
        await updatePageSettings({
            getPage: pageBuilder.getPage,
            updatePage: pageBuilder.updatePage,
            uniquePageId: content.id,
            getNewSettings: settings => {
                return {
                    ...settings,
                    apw: {
                        ...(settings.apw || {}),
                        contentReviewId: null
                    }
                };
            }
        });
    });

    pageBuilder.onPageBeforeDelete.subscribe(async ({ page }) => {
        const contentReviewId = page.settings?.apw?.contentReviewId;
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

        if (contentReview) {
            throw new Error(
                `Cannot delete the page because a peer review has been requested. Please delete the review first.`,
                "CANNOT_DELETE_REVIEW_EXIST",
                {
                    contentReviewId,
                    page
                }
            );
        }
    });
};
