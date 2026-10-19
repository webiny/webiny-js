import { createFeature } from "@webiny/feature/api";
import { WbyAdminExtensionModel } from "./domain/WbyAdminExtensionModel.js";
import { AdminExtensionSchema } from "./graphql/AdminExtensionSchema.js";
import { AdminExtensionPermissionsFeature } from "./features/AdminExtensionPermissions/feature.js";
import { CreateAdminExtensionFeature } from "./features/CreateAdminExtension/feature.js";
import { ListAdminExtensionsFeature } from "./features/ListAdminExtensions/feature.js";
import { SetAdminExtensionEnabledFeature } from "./features/SetAdminExtensionEnabled/feature.js";
import { DeleteAdminExtensionFeature } from "./features/DeleteAdminExtension/feature.js";
import { ListEnabledAdminExtensionsFeature } from "./features/ListEnabledAdminExtensions/feature.js";
import { CreateMenuTool } from "./features/CreateMenuTool/CreateMenuTool.js";
import { CreateFieldRendererTool } from "./features/CreateFieldRendererTool/CreateFieldRendererTool.js";
import { SetFieldRendererTool } from "./features/SetFieldRendererTool/SetFieldRendererTool.js";
import { SetModelFieldRendererFeature } from "./features/SetModelFieldRenderer/feature.js";
import { MenuSourcePreparer } from "./kinds/menu/MenuSourcePreparer.js";
import { FieldRendererSourcePreparer } from "./kinds/fieldRenderer/FieldRendererSourcePreparer.js";

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
        ListEnabledAdminExtensionsFeature.register(container);
        SetModelFieldRendererFeature.register(container);

        // Kinds. A kind can only be created once its source preparer is registered.
        container.register(MenuSourcePreparer);
        container.register(FieldRendererSourcePreparer);

        // Assistant tools. Each one goes through the use cases above, so the permission checks apply.
        container.register(CreateMenuTool);
        container.register(CreateFieldRendererTool);
        container.register(SetFieldRendererTool);
    }
});
