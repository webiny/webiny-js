import {
    ApwChangeRequest,
    ApwContentReview,
    ApwContentReviewCrud,
    LifeCycleHookCallbackParams
} from "~/types";

interface UpdatePendingChangeRequestsParams {
    contentReviewMethods: ApwContentReviewCrud;
    changeRequest: ApwChangeRequest;
    delta: number;
}

interface UpdateContentReviewParams {
    contentReviewMethods: ApwContentReviewCrud;
    id: string;
    getNewContentReviewData: (entry: ApwContentReview) => ApwContentReview;
}

const updateTotalComments = async ({
    contentReviewMethods,
    changeRequest,
    delta
}: UpdatePendingChangeRequestsParams): Promise<void> => {
    const { step } = changeRequest;
    /*
     * Get associated content review entry.
     */
    const [entryId, version, stepId] = step.split("#");
    const revisionId = `${entryId}#${version}`;

    let contentReviewEntry: ApwContentReview;
    try {
        contentReviewEntry = await contentReviewMethods.get(revisionId);
    } catch (e) {
        if (e.message !== "index_not_found_exception" && e.code !== "NOT_FOUND") {
            throw e;
        }
    }
    if (contentReviewEntry) {
        /**
         * Update "pendingChangeRequests" count of corresponding step in content review entry.
         */
        await contentReviewMethods.update(contentReviewEntry.id, {
            steps: contentReviewEntry.steps.map(step => {
                if (step.id === stepId) {
                    return {
                        ...step,
                        totalComments: step.totalComments + delta
                    };
                }
                return step;
            })
        });
    }
};

const updateContentReview = async ({
    contentReviewMethods,
    id,
    getNewContentReviewData
}: UpdateContentReviewParams): Promise<void> => {
    let contentReviewEntry: ApwContentReview;
    try {
        contentReviewEntry = await contentReviewMethods.get(id);
    } catch (e) {
        if (e.message !== "index_not_found_exception" && e.code !== "NOT_FOUND") {
            throw e;
        }
    }
    if (contentReviewEntry) {
        const newContentReviewData = getNewContentReviewData(contentReviewEntry);
        /**
         * Update "pendingChangeRequests" count of corresponding step in content review entry.
         */
        await contentReviewMethods.update(contentReviewEntry.id, newContentReviewData);
    }
};

interface GetContentReviewIdAndStepResult {
    id: string;
    stepId: string;
}

const getContentReviewIdAndStep = (
    step: ApwChangeRequest["step"]
): GetContentReviewIdAndStepResult => {
    /*
     * Get associated content review entry.
     */
    const [entryId, version, stepId] = step.split("#");
    const revisionId = `${entryId}#${version}`;

    return {
        id: revisionId,
        stepId
    };
};

export const updateTotalCommentsCount = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.comment.onAfterCommentDelete.subscribe(async ({ comment }) => {
        /**
         * There is a cycle between "ContentReview", "ChangeRequest" and "Comment" on
         * delete event. So it is possible, "ChangeRequest" doesn't exists, in that case,
         * we'll bail out early.
         */
        let changeRequest;
        try {
            changeRequest = await apw.changeRequest.get(comment.changeRequest);
        } catch (e) {
            if (e.code !== "NOT_FOUND") {
                throw e;
            }
        }
        /**
         * After a "comment" is deleted, decrement the "totalComments" count
         * in the corresponding step of the content review entry.
         */
        if (changeRequest) {
            await updateTotalComments({
                contentReviewMethods: apw.contentReview,
                changeRequest,
                delta: -1
            });
        }
    });

    apw.comment.onAfterCommentCreate.subscribe(async ({ comment }) => {
        /**
         * After a "comment" is created, increment the "totalComments" count
         * of the corresponding step in the content review entry.
         */
        const changeRequest = await apw.changeRequest.get(comment.changeRequest);

        await updateTotalComments({
            contentReviewMethods: apw.contentReview,
            changeRequest,
            delta: 1
        });
    });
};

export const updateLatestCommentId = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.comment.onAfterCommentCreate.subscribe(async ({ comment }) => {
        /**
         * After a "comment" is created, update the "latestCommentId" in
         *  the corresponding content review entry.
         */
        const changeRequest = await apw.changeRequest.get(comment.changeRequest);

        const { id } = getContentReviewIdAndStep(changeRequest.step);

        await updateContentReview({
            contentReviewMethods: apw.contentReview,
            id,
            getNewContentReviewData: data => {
                return {
                    ...data,
                    latestCommentId: comment.id
                };
            }
        });
    });

    apw.comment.onAfterCommentUpdate.subscribe(async ({ comment }) => {
        /**
         * After a "comment" is updated, update the "latestCommentId" in
         *  the corresponding content review entry.
         */
        const changeRequest = await apw.changeRequest.get(comment.changeRequest);

        const { id } = getContentReviewIdAndStep(changeRequest.step);

        await updateContentReview({
            contentReviewMethods: apw.contentReview,
            id,
            getNewContentReviewData: data => {
                return {
                    ...data,
                    latestCommentId: comment.id
                };
            }
        });
    });
};
