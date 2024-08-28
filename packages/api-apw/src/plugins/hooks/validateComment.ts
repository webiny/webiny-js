import WebinyError from "@webiny/error";
import { LifeCycleHookCallbackParams } from "~/types";
import { parseIdentifier, ParseIdentifierResult } from "@webiny/utils";

export const validateComment = ({ apw }: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.comment.onCommentBeforeCreate.subscribe(async ({ input }) => {
        const { changeRequest: changeRequestId } = input;
        /**
         * We need changeRequest to be in a particular format i.e. "contentReviewUniqueId#version"
         */
        let result: ParseIdentifierResult;
        try {
            result = parseIdentifier(changeRequestId);
            if (!result) {
                throw new WebinyError(
                    "Could not parse changeRequestId.",
                    "MALFORMED_CHANGE_REQUEST_ID",
                    {
                        changeRequestId
                    }
                );
            }
        } catch {
            throw new WebinyError(
                `The"changeRequest" property in input is not properly formatted.`,
                "MALFORMED_CHANGE_REQUEST_ID",
                {
                    input
                }
            );
        }

        /**
         * Assign value for "step" field from "changeRequest".
         */
        const changeRequest = await apw.changeRequest.get(changeRequestId);
        if (!changeRequest) {
            return;
        }
        input.step = changeRequest.step;
    });
};
