import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { LifeCycleHookCallbackParams } from "~/types";

export const validateChangeRequest = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.changeRequest.onBeforeChangeRequestCreate.subscribe(async ({ input }) => {
        const { step } = input;
        /**
         * We need step to be in a particular format i.e. "contentReviewId#version#stepId"
         */
        const [entryId, version, stepId] = step.split("#");
        if (!entryId || !version || !stepId) {
            throw new WebinyError(
                `The step property in input is not properly formatted.`,
                "MALFORMED_CHANGE_REQUEST_STEP",
                {
                    step
                }
            );
        }
        /**
         * Check whether a contentReview entry exists with provided id.
         */
        const revisionId = `${entryId}#${version}`;

        const contentReview = await apw.contentReview.get(revisionId);
        if (!contentReview) {
            throw new NotFoundError(
                `Unable to found "ContentReview" with given id "${revisionId}"`
            );
        }
    });
};
