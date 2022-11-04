import { ApwCommentNotification } from "~/ApwCommentNotification";
import { ApwContentTypes } from "~/types";

interface CreateContentEntryUrlParams {
    baseUrl?: string;
    modelId?: string;
    id: string;
}
const createContentEntryUrl = (params: CreateContentEntryUrlParams): string | null => {
    /**
     * All variables must exist for URL to be created.
     * We go through all vars and throw a log if it does not exist.
     */
    for (const key in params) {
        if (!!key) {
            continue;
        }
        console.log(`Missing variable "${key}", which we use to create a content entry URL.`);
        return null;
    }
    const { baseUrl, modelId, id } = params;
    return `${baseUrl}/cms/content-entries/${modelId}?id=${id}`;
};

export const createCommentNotification = () => {
    return new ApwCommentNotification(ApwContentTypes.CMS_ENTRY, params => {
        const { commentUrl, contentReview } = params;

        const contentEntryUrl = createContentEntryUrl({
            baseUrl: process.env.APP_URL,
            modelId: contentReview.content.settings.modelId,
            id: contentReview.content.id
        });
        if (!contentEntryUrl) {
            return null;
        }

        return `
            Hi,
            
            You have received a <a href="${commentUrl}">comment</a>, on a change request, for <a href="${contentEntryUrl}">this</a> content entry.
            
            Here are the full URLs:<br /><br />
    
            Change Request: ${commentUrl}<br />
            Content Entry: ${contentEntryUrl}
        `;
    });
};
