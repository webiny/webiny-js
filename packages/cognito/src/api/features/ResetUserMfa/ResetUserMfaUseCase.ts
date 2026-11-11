import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { FindUserRecordsUseCase } from "@webiny/api-core/features/users/FindUserRecords/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ResetUserMfaUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import {
    CognitoExternalUserError,
    CognitoResetMfaError,
    CognitoSharedAccountError
} from "~/api/domain/errors.js";
import { CognitoService } from "../CognitoService/abstractions.js";

class ResetUserMfaUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private getUserUseCase: GetUserUseCase.Interface,
        private findUserRecords: FindUserRecordsUseCase.Interface
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

        /**
         * Security: the sign-in account is shared by all of the person's tenants, and an
         * administrator of one tenant must not weaken the account used in the others (anyone can
         * link a person to their tenant by email). Like name, email and password, a shared
         * account's MFA can only be reset by the person themselves.
         */
        const recordsResult = await this.findUserRecords.execute(id, { exhaustive: true });
        if (recordsResult.isFail()) {
            return Result.fail(recordsResult.error);
        }

        const hasOtherTenants = recordsResult.value.some(record => record.tenant !== user.tenant);
        const isSelf = this.identityContext.getIdentity().id === id;
        if (hasOtherTenants && !isSelf) {
            return Result.fail(new CognitoSharedAccountError(id));
        }

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
    dependencies: [IdentityContext, CognitoService, GetUserUseCase, FindUserRecordsUseCase]
});
