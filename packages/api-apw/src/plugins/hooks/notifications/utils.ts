import { ApwContentTypes, ApwContext, ApwReviewer, ApwWorkflowStep } from "~/types";
import { ApwCommentNotification } from "~/ApwCommentNotification";

interface GetReviewerListParams {
    steps: ApwWorkflowStep[];
}

interface GetReviewerList {
    (params: GetReviewerListParams): Record<string, ApwReviewer>;
}
export const getReviewers: GetReviewerList = ({ steps }) => {
    return steps.reduce<Record<string, ApwReviewer>>((collection, step) => {
        for (const reviewer of step.reviewers) {
            /**
             * We do not need users which have no e-mail in their data.
             */
            if (!reviewer.email) {
                continue;
            }
            collection[reviewer.entryId] = reviewer;
        }

        return collection;
    }, {});
};

interface CreateCommentUrlParams {
    baseUrl?: string;
    changeRequestId: string;
    contentReviewId: string;
    stepId: string;
}
export const createCommentUrl = (params: CreateCommentUrlParams): string | null => {
    /**
     * All variables must exist for URL to be created.
     * We go through all vars and throw a log if it does not exist.
     */
    for (const key in params) {
        if (!!key) {
            continue;
        }
        console.log(`Missing variable "${key}", which we use to create a comment URL.`);
        return null;
    }
    const { baseUrl, changeRequestId, contentReviewId, stepId } = params;

    return `${baseUrl}/apw/content-reviews/${contentReviewId}/${stepId}/${changeRequestId}`;
};

interface CreateContentEntryUrlParams {
    baseUrl?: string;
    modelId: string;
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

interface GetLastCommentNotificationPluginParams {
    context: ApwContext;
    type: ApwContentTypes;
}
interface GetLastCommentNotificationPlugin {
    (params: GetLastCommentNotificationPluginParams): ApwCommentNotification | undefined;
}
export const getLastNotificationPlugin: GetLastCommentNotificationPlugin = params => {
    const { context, type } = params;
    /**
     * We need the plugin to create the notification text.
     */
    const [commentPlugin] = context.plugins
        .byType<ApwCommentNotification>(ApwCommentNotification.type)
        .filter(plugin => {
            return plugin.canUse(type);
        })
        /**
         * We reverse the array of plugins, because we want the last one that was added.
         */
        .reverse();

    return commentPlugin;
};
