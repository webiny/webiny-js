import { ApwContext } from "~/types";
import { extractContentReviewIdAndStep } from "~/plugins/utils";
import WebinyError from "@webiny/error";
import { createChangeRequestUrl } from "./changeRequest/createChangeRequestUrl";
import { NotFoundError } from "@webiny/handler-graphql";

export const attachChangeRequestAfterCreate = (context: ApwContext): void => {
    context.apw.changeRequest.onChangeRequestAfterCreate.subscribe(async ({ changeRequest }) => {
        const { id: contentReviewId, stepId } = extractContentReviewIdAndStep(changeRequest.step);
        if (!stepId) {
            throw new WebinyError("Malformed changeRequest.step value.", "MALFORMED_VALUE", {
                step: changeRequest.step
            });
        }
        /**
         * We will check if we can create a comment url before we go digging further into the database.
         */
        const url = createChangeRequestUrl({
            baseUrl: process.env.APP_URL,
            changeRequestId: changeRequest.id,
            contentReviewId,
            stepId
        });
        if (!url) {
            return;
        }
        /**
         * Let's see if content review exists.
         */
        const contentReview = await context.apw.contentReview.get(contentReviewId);
        if (!contentReview) {
            throw new WebinyError(
                `There is no contentReview with id "${contentReviewId}".`,
                "CONTENT_REVIEW_NOT_FOUND",
                {
                    contentReviewId
                }
            );
        }

        const { id, type, settings } = contentReview.content;
        const getContent = context.apw.getContentGetter(type);
        const content = await getContent(id, settings);
        if (!content) {
            throw new NotFoundError(`Content "${type}" with id ${id} not found.`);
        }
    });
};
