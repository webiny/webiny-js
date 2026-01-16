import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteUserUseCase as CoreDeleteUser } from "@webiny/api-core/features/DeleteUser";
import { GetUserUseCase } from "@webiny/api-core/features/GetUser";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CognitoService } from "../shared/abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoDeleteUserError } from "~/api/domain/errors.js";

class DeleteUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private deleteUserUseCase: CoreDeleteUser.Interface,
        private getUserUseCase: GetUserUseCase.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // Get user to have email for Cognito deletion
        const getUserResult = await this.getUserUseCase.execute({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const user = getUserResult.value;

        // Delete user from the database
        const deleteUserResult = await this.deleteUserUseCase.execute(id);
        if (deleteUserResult.isFail()) {
            return Result.fail(deleteUserResult.error);
        }

        // Delete user from Cognito
        try {
            await this.cognitoService.deleteUser(Username.fromUser(user));

            return Result.ok();
        } catch (cognitoError) {
            return Result.fail(new CognitoDeleteUserError(cognitoError as Error));
        }
    }
}

export const DeleteUserUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteUserUseCaseImpl,
    dependencies: [IdentityContext, CognitoService, CoreDeleteUser, GetUserUseCase]
});
