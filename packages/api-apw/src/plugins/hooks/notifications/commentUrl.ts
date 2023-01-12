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
