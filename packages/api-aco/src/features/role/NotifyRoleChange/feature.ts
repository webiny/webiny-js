import { createFeature } from "@webiny/feature/api";
import { NotifyRoleChangeUseCase } from "./NotifyRoleChangeUseCase.js";
import {
    NotifyOnRoleCreatedHandler,
    NotifyOnRoleDeletedHandler,
    NotifyOnRoleUpdatedHandler
} from "./NotifyOnRoleChangeHandlers.js";

/** Tells the user's open admin tabs when a role is created, updated or deleted. */
export const NotifyRoleChangeFeature = createFeature({
    name: "NotifyRoleChange",
    register(container) {
        container.register(NotifyRoleChangeUseCase);
        container.register(NotifyOnRoleCreatedHandler);
        container.register(NotifyOnRoleUpdatedHandler);
        container.register(NotifyOnRoleDeletedHandler);
    }
});
