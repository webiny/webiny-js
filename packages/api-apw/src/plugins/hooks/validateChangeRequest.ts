import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { ApwContentReview, LifeCycleHookCallbackParams } from "~/types";
import { extractContentReviewIdAndStep } from "~/plugins/utils";
import { parseIdentifier } from "@webiny/utils";

export const validateChangeRequest = ({ apw }: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.changeRequest.onChangeRequestBeforeCreate.subscribe(async ({ input }) => {
        const { step } = input;
        /**
         * We need step to be in a particular format i.e. "contentReviewId#version#stepId"
         */
        const { id: revisionId, stepId } = extractContentReviewIdAndStep(step);

        const { id: entryId, version } = parseIdentifier(revisionId);
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
        let contentReview: ApwContentReview | undefined = undefined;
        try {
            contentReview = await apw.contentReview.get(revisionId);
        } catch (ex) {
            /**
             * There is no need to output the log if this is the test environment.
             */
            if (process.env.NODE_ENV !== "test") {
                console.log({
                    message: ex.message,
                    code: ex.data,
                    data: ex.data
                });
            }
        }
        if (!contentReview) {
            throw new NotFoundError(
                `Unable to found "ContentReview" with given id "${revisionId}"`
            );
        }
        /**
         * Don't allow "change request" creation once the sign-off has been provided.
         */
        const { steps } = contentReview;
        const currentStep = steps.find(step => step.id === stepId);

        if (currentStep && currentStep.signOffProvidedOn) {
            throw new WebinyError(
                `Please retract the sign-off before opening a new change request.`,
                "SIGN_OFF_PROVIDED",
                {
                    step: currentStep,
                    stepId: stepId
                }
            );
        }
    });
};
