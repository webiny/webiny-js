import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION } from "~/features/notifications/shared/constants.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import type { WorkflowReviewChangedWebsocketData } from "~/domain/notifications/types.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/abstractions.js";
import { ReviewChangeNotifierService as Abstraction } from "./abstractions.js";

const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";

class ReviewChangeNotifierServiceImpl implements Abstraction.Interface {
    public constructor(
        private websocketSender: ReviewWebsocketSender.Interface,
        private logger: Logger.Interface
    ) {}

    public async notify(params: Abstraction.Params): Promise<void> {
        const { review, stepId, kind, recipientIds } = params;
        if (recipientIds.length === 0) {
            return;
        }

        const data: WorkflowReviewChangedWebsocketData = {
            kind,
            reviewId: review.id,
            stepId,
            namespace: review.model,
            targetId: review.targetId,
            targetRevisionId: review.targetRevisionId
        };

        // The sender never rejects; this catch only guards a decorator that does (R87).
        try {
            await this.websocketSender.send({
                reviewId: review.id,
                event: kind,
                recipientIds,
                action: WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION,
                data
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: kind },
                WEBSOCKET_TEXT
            );
        }
    }
}

export const ReviewChangeNotifierService = Abstraction.createImplementation({
    implementation: ReviewChangeNotifierServiceImpl,
    dependencies: [ReviewWebsocketSender, Logger]
});
