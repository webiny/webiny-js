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

const updatePendingChangeRequests = async ({
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
                        pendingChangeRequests: step.pendingChangeRequests + delta
                    };
                }
                return step;
            })
        });
    }
};

export const updatePendingChangeRequestsCount = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.changeRequest.onAfterChangeRequestDelete.subscribe(async ({ changeRequest }) => {
        /**
         * After a "changeRequest" is deleted, decrement the "pendingChangeRequests" count
         * in the corresponding step of the content review entry.
         */
        await updatePendingChangeRequests({
            contentReviewMethods: apw.contentReview,
            changeRequest: changeRequest,
            delta: -1
        });
    });

    apw.changeRequest.onAfterChangeRequestCreate.subscribe(async ({ changeRequest }) => {
        /**
         * After a "changeRequest" is created, increment the "pendingChangeRequests" count
         * of the corresponding step in the content review entry.
         */
        await updatePendingChangeRequests({
            contentReviewMethods: apw.contentReview,
            changeRequest,
            delta: 1
        });
    });

    apw.changeRequest.onAfterChangeRequestUpdate.subscribe(async ({ changeRequest, original }) => {
        /**
         * After a "changeRequest" is created, and the value of "resolved" field has changed;
         * then we also need to update the "pendingChangeRequests" count of the corresponding step in the content review entry.
         */
        if (original.resolved !== changeRequest.resolved) {
            const resolved = changeRequest.resolved;
            const delta = resolved === true ? -1 : 1;

            await updatePendingChangeRequests({
                contentReviewMethods: apw.contentReview,
                changeRequest,
                delta
            });
        }
    });
};
