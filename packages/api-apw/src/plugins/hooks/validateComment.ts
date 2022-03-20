import WebinyError from "@webiny/error";
import { LifeCycleHookCallbackParams } from "~/types";

export const validateComment = ({ apw }: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.comment.onBeforeCommentCreate.subscribe(async ({ input }) => {
        const { changeRequest: changeRequestId } = input;
        /**
         * We need changeRequest to be in a particular format i.e. "contentReviewUniqueId#version"
         */
        const [entryId, version] = changeRequestId.split("#");
        if (!entryId || !version) {
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
        if (changeRequest) {
            input.step = changeRequest.step;
        }
    });
};
