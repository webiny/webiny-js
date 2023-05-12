/**
 * In this file we create a plugin which in turn creates a content entry url when requested by the code which sends notifications.
 * Due to multiple content types for the APW, everything needs to be pluginable.
 */
import { createApwContentUrlPlugin } from "~/ApwContentUrlPlugin";
import { ApwContentTypes } from "~/types";

interface CreatePageUrlParams {
    baseUrl?: string;
    id: string;
}
const createPageUrl = (params: CreatePageUrlParams): string | null => {
    /**
     * All variables must exist for URL to be created.
     * We go through all vars and throw a log if it does not exist.
     */
    for (const key in params) {
        if (!!key) {
            continue;
        }
        console.log(`Missing variable "${key}", which we use to create a page URL.`);
        return null;
    }
    const { baseUrl, id } = params;
    return `${baseUrl}/page-builder/pages?id=${id}`;
};

export const createContentUrlPlugin = () => {
    return createApwContentUrlPlugin(ApwContentTypes.PAGE, params => {
        const { baseUrl, contentReview } = params;
        const { id } = contentReview.content;
        return createPageUrl({
            baseUrl,
            id
        });
    });
};
