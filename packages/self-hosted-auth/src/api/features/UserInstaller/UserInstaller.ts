import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { GetRoleUseCase } from "@webiny/api-core/features/security/roles/GetRole/index.js";
import { CreateUserUseCase } from "@webiny/api-core/features/users/CreateUser/index.js";
import { DeleteUserUseCase } from "@webiny/api-core/features/users/DeleteUser/index.js";
import { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";
import { CredentialsStorageOperations } from "~/api/storage/abstractions.js";

interface UserInstallationData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

/**
 * Seeds the first admin user for the self-hosted IdP. Unlike Cognito (which
 * pushes the user into an external pool), we compose two local steps:
 *   1. create the admin user via api-core's `CreateUserUseCase`;
 *   2. store its password via our own `SetPasswordUseCase`.
 *
 * If step 2 fails, step 1 is rolled back so a half-installed user never lingers.
 */
class UserInstallerImpl implements AppInstaller.Interface<UserInstallationData> {
    readonly alwaysRun = false;
    readonly appName = "SelfHostedAuth";
    readonly dependsOn = ["Security"];
    private createdUser: AdminUser | undefined;

    constructor(
        private getRole: GetRoleUseCase.Interface,
        private createUserUseCase: CreateUserUseCase.Interface,
        private setPasswordUseCase: SetPasswordUseCase.Interface,
        private deleteUserUseCase: DeleteUserUseCase.Interface,
        private credentials: CredentialsStorageOperations.Interface
    ) {}

    async install(_tenant: Tenant, data: UserInstallationData): Promise<void> {
        const roleResult = await this.getRole.execute({ slug: "full-access" });
        if (roleResult.isFail()) {
            throw new Error(`Failed to get full-access role: ${roleResult.error.message}`);
        }

        const role = roleResult.value;

        const createResult = await this.createUserUseCase.execute({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: `${data.firstName} ${data.lastName}`,
            roles: [role.id],
            teams: []
        });
        if (createResult.isFail()) {
            throw new Error(`Failed to create admin user: ${createResult.error.message}`);
        }

        this.createdUser = createResult.value;

        const passwordResult = await this.setPasswordUseCase.execute({
            userId: this.createdUser.id,
            email: this.createdUser.email,
            password: data.password
        });
        if (passwordResult.isFail()) {
            // Roll back the user we just created before surfacing the failure.
            await this.deleteUserUseCase.execute(this.createdUser.id);
            this.createdUser = undefined;
            throw new Error(`Failed to set admin password: ${passwordResult.error.message}`);
        }
    }

    async uninstall(_tenant: Tenant): Promise<void> {
        if (!this.createdUser) {
            return;
        }

        // Deleting the user does not cascade to credentials, so remove both.
        await this.credentials.deleteCredential({
            userId: this.createdUser.id
        });
        await this.deleteUserUseCase.execute(this.createdUser.id);
        this.createdUser = undefined;
    }
}

export const UserInstaller = AppInstaller.createImplementation({
    implementation: UserInstallerImpl,
    dependencies: [
        GetRoleUseCase,
        CreateUserUseCase,
        SetPasswordUseCase,
        DeleteUserUseCase,
        CredentialsStorageOperations
    ]
});
