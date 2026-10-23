import { z } from "zod";
import { Result } from "@webiny/feature/api";
import { AdminUsersRepository } from "@webiny/api-core/features/users/shared/abstractions.js";
import {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CheckEmailUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoGetUserError } from "~/api/domain/errors.js";
import { CognitoService } from "~/api/features/CognitoService/index.js";

const emailValidation = z.string().email();

class CheckEmailUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(
        email: string
    ): Promise<Result<UseCaseAbstraction.Status, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = emailValidation.safeParse(email);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.issues[0].message));
        }

        const existingUserResult = await this.repository.get({ email });
        if (existingUserResult.isOk()) {
            return Result.ok("EXISTS_HERE");
        }

        try {
            const cognitoUser = await this.cognitoService.getUser(Username.fromUser({ email }));
            // Only an account with a user ID can be linked. Any other account makes
            // creating the user fail, as it always has.
            if (cognitoUser?.attributes["custom:id"]) {
                return Result.ok("EXISTS_ELSEWHERE");
            }
        } catch (error) {
            return Result.fail(new CognitoGetUserError(error as Error));
        }

        return Result.ok("AVAILABLE");
    }
}

export const CheckEmailUseCase = UseCaseAbstraction.createImplementation({
    implementation: CheckEmailUseCaseImpl,
    dependencies: [IdentityContext, CognitoService, AdminUsersRepository]
});
