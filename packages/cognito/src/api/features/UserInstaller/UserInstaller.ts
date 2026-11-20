import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { GetRoleUseCase } from "@webiny/api-core/features/security/roles/GetRole/index.js";
import { DeleteUserUseCase } from "~/api/features/DeleteUser/index.js";
import { CreateUserUseCase } from "~/api/features/CreateUser/index.js";
import { LinkUserUseCase } from "~/api/features/LinkUser/index.js";

interface UserInstallationData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

class UsersInstallerImpl implements AppInstaller.Interface<UserInstallationData> {
    readonly alwaysRun = false;
    readonly appName = "Cognito";
    readonly dependsOn = ["Security"];
    private createdUser: AdminUser | undefined;

    constructor(
        private getRole: GetRoleUseCase.Interface,
        private createUserUseCase: CreateUserUseCase.Interface,
        private linkUserUseCase: LinkUserUseCase.Interface,
        private deleteUserUseCase: DeleteUserUseCase.Interface
    ) {}

    async install(_: Tenant, data: UserInstallationData): Promise<void> {
        // Load `full-access` role and assign it to the new user
        const roleResult = await this.getRole.execute({ slug: "full-access" });
        if (roleResult.isFail()) {
            throw new Error(`Failed to get full-access role: ${roleResult.error.message}`);
        }

        const role = roleResult.value;

        // Create user with displayName and full-access role
        const userWithDisplayName: CreateUserUseCase.Input = {
            ...data,
            displayName: `${data.firstName} ${data.lastName}`,
            roles: [role.id],
            teams: []
        };

        const createResult = await this.createUserUseCase.execute(userWithDisplayName);
        if (createResult.isOk()) {
            this.createdUser = createResult.value;
            return;
        }

        if (createResult.error.code !== "Cognito/Account/ExistsInOtherTenant") {
            throw new Error(`Failed to create admin user: ${createResult.error.message}`);
        }

        // Creating a tenant for someone who already has an account is deliberate, so their
        // account is linked: they keep their name and password, and the given ones aren't used.
        const linkResult = await this.linkUserUseCase.execute({
            email: data.email,
            roles: [role.id],
            teams: []
        });
        if (linkResult.isFail()) {
            throw new Error(`Failed to link admin user: ${linkResult.error.message}`);
        }

        this.createdUser = linkResult.value;
    }

    async uninstall(): Promise<void> {
        if (this.createdUser) {
            await this.deleteUserUseCase.execute(this.createdUser.id);
        }
    }
}

export const UserInstaller = AppInstaller.createImplementation({
    implementation: UsersInstallerImpl,
    dependencies: [GetRoleUseCase, CreateUserUseCase, LinkUserUseCase, DeleteUserUseCase]
});
