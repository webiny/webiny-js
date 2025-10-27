import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-tenancy/features/InstallTenant";
import type { Tenant } from "@webiny/api-tenancy/types.js";
import type { AdminUser } from "@webiny/api-admin-users/types";
import { CreateUserUseCase } from "@webiny/api-admin-users/features/CreateUser";
import { DeleteUserUseCase } from "@webiny/api-admin-users/features/DeleteUser";
import { GetGroupUseCase } from "@webiny/api-security/features/groups/GetGroup";

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
        private getGroup: GetGroupUseCase.Interface,
        private createUserUseCase: CreateUserUseCase.Interface,
        private deleteUserUseCase: DeleteUserUseCase.Interface
    ) {}

    async install(_: Tenant, data: AdminUserInstallationData): Promise<void> {
        // Load `full-access` group and assign it to the new user
        const groupResult = await this.getGroup.execute({ slug: "full-access" });
        if (groupResult.isFail()) {
            throw new Error(`Failed to get full-access group: ${groupResult.error.message}`);
        }

        const group = groupResult.value;

        // Create user with displayName and full-access group
        const userWithDisplayName = {
            ...data,
            displayName: `${data.firstName} ${data.lastName}`,
            groups: [group.id]
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
    dependencies: [GetGroupUseCase, CreateUserUseCase, DeleteUserUseCase]
});
