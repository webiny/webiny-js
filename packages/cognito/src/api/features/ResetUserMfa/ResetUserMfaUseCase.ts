import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ResetUserMfaUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoExternalUserError, CognitoResetMfaError } from "~/api/domain/errors.js";
import { CognitoService } from "../CognitoService/abstractions.js";

class ResetUserMfaUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private getUserUseCase: GetUserUseCase.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        const getUserResult = await this.getUserUseCase.execute({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const user = getUserResult.value;

        // A federated user signs in through their own identity provider, which handles their MFA.
        if (user.external) {
            return Result.fail(new CognitoExternalUserError(id));
        }

        // Unlike changing a shared account's name, email or password, any administrator of one of
        // the person's tenants may reset its MFA: the person can't do it themselves when they can't
        // sign in, and the reset doesn't give the administrator access to the account.
        try {
            await this.cognitoService.resetMfa(Username.fromUser(user));

            return Result.ok();
        } catch (cognitoError) {
            return Result.fail(new CognitoResetMfaError(cognitoError as Error));
        }
    }
}

export const ResetUserMfaUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ResetUserMfaUseCaseImpl,
    dependencies: [IdentityContext, CognitoService, GetUserUseCase]
});
