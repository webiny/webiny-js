import { AppInstaller } from "~/features/tenancy/InstallTenant/index.js";
import { createImplementation } from "@webiny/feature/api";
import { Role } from "../shared/types.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { CreateRoleUseCase } from "~/features/security/roles/CreateRole/index.js";
import { DeleteRoleUseCase } from "~/features/security/roles/DeleteRole/index.js";

class RolesInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "Security";
    readonly dependsOn = [];
    private createdRoles: Role[] = [];

    constructor(
        private listRolesUseCase: ListRolesUseCase.Interface,
        private createRoleUseCase: CreateRoleUseCase.Interface,
        private deleteRoleUseCase: DeleteRoleUseCase.Interface
    ) {}

    async install(): Promise<void> {
        const rolesResult = await this.listRolesUseCase.execute();
        const roles = rolesResult.value;

        if (!roles.find(g => g.slug === "full-access")) {
            const result = await this.createRoleUseCase.execute({
                name: "Full Access",
                description: "Grants full access to all apps.",
                system: true,
                slug: "full-access",
                permissions: [{ name: "*" }]
            });

            if (result.isFail()) {
                throw result.error;
            }

            this.createdRoles.push(result.value);
        }
    }

    async uninstall(): Promise<void> {
        for (const role of this.createdRoles) {
            await this.deleteRoleUseCase.execute(role.id);
        }
    }
}

export const RoleInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: RolesInstallerImpl,
    dependencies: [ListRolesUseCase, CreateRoleUseCase, DeleteRoleUseCase]
});
