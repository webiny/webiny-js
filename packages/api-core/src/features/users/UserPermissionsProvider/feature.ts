import { createFeature } from "@webiny/feature/api";
import { UserPermissionsProvider } from "./UserPermissionsProvider.js";

export const UserPermissionsProviderFeature = createFeature({
    name: "UserPermissionsProvider",
    register(container) {
        container.register(UserPermissionsProvider);
    }
});
