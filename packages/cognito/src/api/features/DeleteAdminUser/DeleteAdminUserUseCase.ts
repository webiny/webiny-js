import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteUserUseCase } from "@webiny/api-core/features/DeleteUser";
import { GetUserUseCase } from "@webiny/api-core/features/GetUser";
import { DeleteAdminUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CognitoService } from "../shared/abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoDeleteUserError } from "~/api/domain/errors.js";

class DeleteAdminUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private cognitoService: CognitoService.Interface,
        private deleteUserUseCase: DeleteUserUseCase.Interface,
        private getUserUseCase: GetUserUseCase.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        // 1. Get user to have email for Cognito deletion
        const getUserResult = await this.getUserUseCase.execute({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const user = getUserResult.value;

        // 2. Delete user from api-core
        const deleteUserResult = await this.deleteUserUseCase.execute(id);
        if (deleteUserResult.isFail()) {
            return Result.fail(deleteUserResult.error);
        }

        // 3. Delete user from Cognito
        try {
            await this.cognitoService.deleteUser(Username.fromUser(user));

            return Result.ok();
        } catch (cognitoError) {
            return Result.fail(new CognitoDeleteUserError(cognitoError as Error));
        }
    }
}

export const DeleteAdminUserUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteAdminUserUseCaseImpl,
    dependencies: [CognitoService, DeleteUserUseCase, GetUserUseCase]
});
