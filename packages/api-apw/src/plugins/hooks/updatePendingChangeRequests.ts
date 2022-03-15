import { ApwChangeRequest, ApwContentReviewCrud, LifeCycleHookCallbackParams } from "~/types";
import {
    extractContentReviewIdAndStep,
    updateContentReview,
    updateContentReviewStep
} from "../utils";

interface UpdatePendingChangeRequestsParams {
    contentReviewMethods: ApwContentReviewCrud;
    delta: number;
    step: ApwChangeRequest["step"];
}

const updatePendingChangeRequests = async ({
    contentReviewMethods,
    step,
    delta
}: UpdatePendingChangeRequestsParams): Promise<void> => {
    const { id, stepId } = extractContentReviewIdAndStep(step);

    await updateContentReview({
        contentReviewMethods,
        id,
        getNewContentReviewData: data => {
            return {
                ...data,
                steps: updateContentReviewStep(data.steps, stepId, step => ({
                    ...step,
                    pendingChangeRequests: step.pendingChangeRequests + delta
                }))
            };
        }
    });
};

export const updatePendingChangeRequestsCount = ({
    apw
}: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.changeRequest.onAfterChangeRequestDelete.subscribe(async ({ changeRequest }) => {
        /**
         * If the deleted changeRequest was marked as resolved. We don't need to do anything here,
         * because "pendingChangeRequests has been already updated in "onAfterChangeRequestUpdate" hook.
         */
        if (changeRequest.resolved === true) {
            return;
        }
        /**
         * After a "changeRequest" is deleted, decrement the "pendingChangeRequests" count
         * in the corresponding step of the content review entry.
         */
        await updatePendingChangeRequests({
            contentReviewMethods: apw.contentReview,
            step: changeRequest.step,
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
            step: changeRequest.step,
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
                step: changeRequest.step,
                delta
            });
        }
    });
};
