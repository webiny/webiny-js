import { createFeature } from "@webiny/feature/admin";
import { TeamWebsocketMessages } from "./TeamWebsocketMessages.js";

/**
 * Passes team messages from the websocket to the admin's teams list. The handler that updates the
 * list is registered by app-admin's `TeamEventsFeature`.
 */
export const TeamEventsBridgeFeature = createFeature({
    name: "Aco/TeamEventsBridge",
    register(container) {
        container.register(TeamWebsocketMessages);
    }
});
