import { createFeature } from "@webiny/feature/api";
import { RolesRepository } from "./shared/RolesRepository.js";
import { GetRoleFeature } from "./GetRole/feature.js";
import { ListRolesFeature } from "./ListRoles/feature.js";
import { CreateRoleFeature } from "./CreateRole/feature.js";
import { UpdateRoleFeature } from "./UpdateRole/feature.js";
import { DeleteRoleFeature } from "./DeleteRole/feature.js";
import { RoleInstaller } from "~/features/security/roles/Installer/RolesInstaller.js";

export const RolesFeature = createFeature({
    name: "Roles",
    register(container) {
        // Register repository in singleton scope
        container.register(RolesRepository).inSingletonScope();

        // Register all use cases
        GetRoleFeature.register(container);
        ListRolesFeature.register(container);
        CreateRoleFeature.register(container);
        UpdateRoleFeature.register(container);
        DeleteRoleFeature.register(container);

        container.register(RoleInstaller);
    }
});
