/**
 * In this file we create a plugin which in turn creates a content entry url when requested by the code which sends notifications.
 * Due to multiple content types for the APW, everything needs to be pluginable.
 */
import { createApwContentUrlPlugin } from "~/ApwContentUrlPlugin";
import { ApwContentTypes } from "~/types";

interface CreateContentEntryUrlParams {
    baseUrl?: string;
    modelId?: string;
    id: string;
}
export const createContentEntryUrl = (params: CreateContentEntryUrlParams): string | null => {
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

export const createContentUrlPlugin = () => {
    return createApwContentUrlPlugin(ApwContentTypes.CMS_ENTRY, params => {
        const { baseUrl, contentReview } = params;
        const { id } = contentReview.content;
        const { modelId } = contentReview.content.settings;
        return createContentEntryUrl({
            baseUrl,
            modelId,
            id
        });
    });
};
