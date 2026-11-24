import { createFeature } from "@webiny/feature/admin";
import { AdminUsersCapabilities } from "./abstractions.js";

export const AdminUsersCapabilitiesFeature = createFeature<
    { capabilities: AdminUsersCapabilities.Interface },
    [Partial<AdminUsersCapabilities.Interface>]
>({
    name: "AdminUsers/Capabilities",
    register(container, capabilities) {
        container.registerInstance(AdminUsersCapabilities, {
            linkAccounts: capabilities.linkAccounts ?? false,
            resetMfa: capabilities.resetMfa ?? false
        });
    },
    resolve(container) {
        return {
            capabilities: container.resolve(AdminUsersCapabilities)
        };
    }
});
