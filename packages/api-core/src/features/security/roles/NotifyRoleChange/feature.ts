import { createFeature } from "@webiny/feature/api";
import { NotifyRoleChangeUseCase } from "./NotifyRoleChangeUseCase.js";
import { NotifyOnRoleCreatedHandler } from "./NotifyOnRoleCreatedHandler.js";
import { NotifyOnRoleUpdatedHandler } from "./NotifyOnRoleUpdatedHandler.js";
import { NotifyOnRoleDeletedHandler } from "./NotifyOnRoleDeletedHandler.js";

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
