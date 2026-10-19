import { createFeature } from "@webiny/feature/api";
import { WbyAdminExtensionModel } from "./domain/WbyAdminExtensionModel.js";
import { AdminExtensionSchema } from "./graphql/AdminExtensionSchema.js";
import { AdminExtensionPermissionsFeature } from "./features/AdminExtensionPermissions/feature.js";
import { CreateAdminExtensionFeature } from "./features/CreateAdminExtension/feature.js";
import { ListAdminExtensionsFeature } from "./features/ListAdminExtensions/feature.js";
import { SetAdminExtensionEnabledFeature } from "./features/SetAdminExtensionEnabled/feature.js";
import { DeleteAdminExtensionFeature } from "./features/DeleteAdminExtension/feature.js";

/** Storage and management for admin extensions: what the admin loads at runtime, and its switch. */
export const AdminExtensionsFeature = createFeature({
    name: "RemoteComponents/AdminExtensions",
    register(container) {
        container.register(WbyAdminExtensionModel);
        container.register(AdminExtensionSchema);

        AdminExtensionPermissionsFeature.register(container);
        CreateAdminExtensionFeature.register(container);
        ListAdminExtensionsFeature.register(container);
        SetAdminExtensionEnabledFeature.register(container);
        DeleteAdminExtensionFeature.register(container);
    }
});
