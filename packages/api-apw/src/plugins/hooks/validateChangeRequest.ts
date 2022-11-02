import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { ApwContentReview, LifeCycleHookCallbackParams } from "~/types";

export const validateChangeRequest = ({ apw }: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.changeRequest.onChangeRequestBeforeCreate.subscribe(async ({ input }) => {
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

        let contentReview: ApwContentReview | undefined = undefined;
        try {
            contentReview = await apw.contentReview.get(revisionId);
        } catch (ex) {
            console.log({
                message: ex.message,
                code: ex.data,
                data: ex.data
            });
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
