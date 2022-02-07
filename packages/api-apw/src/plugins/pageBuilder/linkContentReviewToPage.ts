import set from "lodash/set";
import { ApwContentTypes } from "~/types";
import { updatePageSettings } from "~/plugins/hooks/linkWorkflowToPage/utils";
import { InitiateContentReviewParams } from ".";

export const linkContentReviewToPage = ({ pageBuilder, apw }: InitiateContentReviewParams) => {
    apw.contentReview.onAfterContentReviewCreate.subscribe(async ({ contentReview }) => {
        const { content } = contentReview;

        if (content.type === ApwContentTypes.PAGE) {
            await updatePageSettings({
                getPage: pageBuilder.getPage,
                updatePage: pageBuilder.updatePage,
                uniquePageId: content.id,
                getNewSettings: settings => {
                    return set(settings, "apw.contentReviewId", contentReview.id);
                }
            });
        }
    });
};
