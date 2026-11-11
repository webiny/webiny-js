import { createFeature } from "@webiny/feature/api";
import { NotifyOnTeamCreatedHandler } from "./NotifyOnTeamCreatedHandler.js";

/** Tells the user's open admin tabs when a team is created. */
export const NotifyTeamCreatedFeature = createFeature({
    name: "NotifyTeamCreated",
    register(container) {
        container.register(NotifyOnTeamCreatedHandler);
    }
});
