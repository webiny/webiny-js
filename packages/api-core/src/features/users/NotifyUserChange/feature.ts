import { createFeature } from "@webiny/feature/api";
import { NotifyUserChangeUseCase } from "./NotifyUserChangeUseCase.js";
import {
    NotifyOnUserCreatedHandler,
    NotifyOnUserDeletedHandler,
    NotifyOnUserUpdatedHandler
} from "./NotifyOnUserChangeHandlers.js";

/** Tells the user's open admin tabs when an admin user is created, updated or deleted. */
export const NotifyUserChangeFeature = createFeature({
    name: "NotifyUserChange",
    register(container) {
        container.register(NotifyUserChangeUseCase);
        container.register(NotifyOnUserCreatedHandler);
        container.register(NotifyOnUserUpdatedHandler);
        container.register(NotifyOnUserDeletedHandler);
    }
});
