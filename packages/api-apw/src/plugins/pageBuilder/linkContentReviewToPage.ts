import set from "lodash/set";
import get from "lodash/get";
import Error from "@webiny/error";
import { ApwContentTypes } from "~/types";
import { updatePageSettings } from "./utils";
import { ApwPageBuilderMethods, ApwPageBuilderPluginsParams } from ".";

interface LinkContentReviewToPageParams
    extends Pick<ApwPageBuilderPluginsParams, "apw">,
        Pick<ApwPageBuilderMethods, "getPage" | "updatePage" | "onBeforePageDelete"> {}

export const linkContentReviewToPage = (params: LinkContentReviewToPageParams) => {
    const { getPage, updatePage, apw, onBeforePageDelete } = params;

    apw.contentReview.onAfterContentReviewCreate.subscribe(async ({ contentReview }) => {
        const { content } = contentReview;

        if (content.type === ApwContentTypes.PAGE) {
            await updatePageSettings({
                getPage,
                updatePage,
                uniquePageId: content.id,
                getNewSettings: settings => {
                    return set(settings, "apw.contentReviewId", contentReview.id);
                }
            });
        }
    });

    apw.contentReview.onAfterContentReviewDelete.subscribe(async ({ contentReview }) => {
        const { content } = contentReview;

        if (content.type === ApwContentTypes.PAGE) {
            await updatePageSettings({
                getPage,
                updatePage,
                uniquePageId: content.id,
                getNewSettings: settings => {
                    return set(settings, "apw.contentReviewId", null);
                }
            });
        }
    });

    onBeforePageDelete.subscribe(async ({ page }) => {
        const contentReviewId = get(page, "settings.apw.contentReviewId");
        if (!contentReviewId) {
            return;
        }

        let contentReview;
        try {
            contentReview = await apw.contentReview.get(contentReviewId);
        } catch (e) {
            /**
             * We're handling the case whereby "contentReviewId" is still linked to page;
             * even when the contentReview entry has been deleted. In that case, we'll allow page deletion.
             */
            if (e.code !== "NOT_FOUND") {
                throw e;
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
