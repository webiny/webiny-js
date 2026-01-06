import { createImplementation } from "@webiny/feature/api";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { AppInstaller } from "@webiny/api-core/features/InstallTenant";
import { CreateUserUseCase } from "@webiny/api-core/features/CreateUser";
import { DeleteUserUseCase } from "@webiny/api-core/features/DeleteUser";
import { GetRoleUseCase } from "@webiny/api-core/features/GetRole";

interface AdminUserInstallationData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

class AdminUsersInstallerImpl implements AppInstaller.Interface<AdminUserInstallationData> {
    readonly alwaysRun = false;
    readonly appName = "AdminUser";
    readonly dependsOn = ["Security"];
    private createdUser: AdminUser | undefined;

    constructor(
        private getRole: GetRoleUseCase.Interface,
        private createUserUseCase: CreateUserUseCase.Interface,
        private deleteUserUseCase: DeleteUserUseCase.Interface
    ) {}

    async install(_: Tenant, data: AdminUserInstallationData): Promise<void> {
        // Load `full-access` group and assign it to the new user
        const groupResult = await this.getRole.execute({ slug: "full-access" });
        if (groupResult.isFail()) {
            throw new Error(`Failed to get full-access group: ${groupResult.error.message}`);
        }

        const group = groupResult.value;

        // Create user with displayName and full-access group
        const userWithDisplayName: CreateUserUseCase.Input = {
            ...data,
            displayName: `${data.firstName} ${data.lastName}`,
            roles: [group.id],
            teams: []
        };

        const createResult = await this.createUserUseCase.execute(userWithDisplayName);
        if (createResult.isFail()) {
            throw new Error(`Failed to create admin user: ${createResult.error.message}`);
        }

        this.createdUser = createResult.value;
    }

    async uninstall(): Promise<void> {
        if (this.createdUser) {
            await this.deleteUserUseCase.execute(this.createdUser.id);
        }
    }
}

export const AdminUserInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: AdminUsersInstallerImpl,
    dependencies: [GetRoleUseCase, CreateUserUseCase, DeleteUserUseCase]
});
