import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteUserUseCase as CoreDeleteUser } from "@webiny/api-core/features/users/DeleteUser/index.js";
import { CannotDeleteOwnAccountError } from "@webiny/api-core/features/users/DeleteUser/errors.js";
import { DeleteCredentialUseCase } from "~/api/features/DeleteCredential/index.js";
import { DeleteAdminUserUseCase as UseCaseAbstraction } from "./abstractions.js";

class DeleteAdminUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private deleteUser: CoreDeleteUser.Interface,
        private deleteCredential: DeleteCredentialUseCase.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // api-core refuses this too, but only after the credential below would already be gone.
        if (this.identityContext.getIdentity().id === id) {
            return Result.fail(new CannotDeleteOwnAccountError());
        }

        // The credential goes first. If the user then fails to delete, it is left unable to sign in
        // and the delete can be retried. The other way round, a failure would leave a password
        // that still signs in to a user that no longer exists.
        const credentialDeleted = await this.deleteCredential.execute({ userId: id });
        if (credentialDeleted.isFail()) {
            return Result.fail(credentialDeleted.error);
        }

        return this.deleteUser.execute(id);
    }
}

export const DeleteAdminUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteAdminUserUseCaseImpl,
    dependencies: [IdentityContext, CoreDeleteUser, DeleteCredentialUseCase]
});
