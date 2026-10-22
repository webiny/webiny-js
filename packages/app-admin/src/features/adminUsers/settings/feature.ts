import { createFeature } from "@webiny/feature/admin";
import { AdminUsersSettings } from "./abstractions.js";

export const AdminUsersSettingsFeature = createFeature<
    { settings: AdminUsersSettings.Interface },
    [AdminUsersSettings.Interface]
>({
    name: "AdminUsers/Settings",
    register(container, settings) {
        container.registerInstance(AdminUsersSettings, settings);
    },
    resolve(container) {
        return {
            settings: container.resolve(AdminUsersSettings)
        };
    }
});
