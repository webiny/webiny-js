import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteUserUseCase as CoreDeleteUser } from "@webiny/api-core/features/users/DeleteUser/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { FindUserRecordsUseCase } from "@webiny/api-core/features/users/FindUserRecords/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoDeleteUserError } from "~/api/domain/errors.js";
import { CognitoService } from "../CognitoService/abstractions.js";

class DeleteUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private deleteUserUseCase: CoreDeleteUser.Interface,
        private getUserUseCase: GetUserUseCase.Interface,
        private findUserRecords: FindUserRecordsUseCase.Interface
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

        // The sign-in account is shared by all of the user's tenants. Look them up before
        // deleting anything, so a failed lookup leaves everything as it was.
        const recordsResult = await this.findUserRecords.execute(id, { exhaustive: true });
        if (recordsResult.isFail()) {
            return Result.fail(recordsResult.error);
        }

        const inOtherTenants = recordsResult.value.some(record => record.tenant !== user.tenant);

        // Delete user from the database
        const deleteUserResult = await this.deleteUserUseCase.execute(id);
        if (deleteUserResult.isFail()) {
            return Result.fail(deleteUserResult.error);
        }

        if (inOtherTenants) {
            return Result.ok();
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
    dependencies: [
        IdentityContext,
        CognitoService,
        CoreDeleteUser,
        GetUserUseCase,
        FindUserRecordsUseCase
    ]
});
