import { createFeature } from "@webiny/feature/api";
import { NotifyTeamChangeUseCase } from "./NotifyTeamChangeUseCase.js";
import {
    NotifyOnTeamCreatedHandler,
    NotifyOnTeamDeletedHandler,
    NotifyOnTeamUpdatedHandler
} from "./NotifyOnTeamChangeHandlers.js";

/** Tells the user's open admin tabs when a team is created, updated or deleted. */
export const NotifyTeamChangeFeature = createFeature({
    name: "NotifyTeamChange",
    register(container) {
        container.register(NotifyTeamChangeUseCase);
        container.register(NotifyOnTeamCreatedHandler);
        container.register(NotifyOnTeamUpdatedHandler);
        container.register(NotifyOnTeamDeletedHandler);
    }
});
