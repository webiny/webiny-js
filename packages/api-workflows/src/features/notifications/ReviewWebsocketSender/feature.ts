import { createFeature } from "@webiny/feature/api";
import { ReviewWebsocketSender } from "./ReviewWebsocketSender.js";

export const ReviewWebsocketSenderFeature = createFeature({
    name: "WorkflowNotifications/ReviewWebsocketSender",
    register(container) {
        container.register(ReviewWebsocketSender);
    }
});
