import { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { UserValidationError } from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { UpdateUserUseCase as CoreUpdateUser } from "@webiny/api-core/features/users/UpdateUser/index.js";
import { AccountExistsError } from "~/api/domain/errors.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";
import { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";
import { UpdateAdminUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { UpdateAdminUserInput } from "./abstractions.js";
import { updateAdminUserValidation } from "./schema.js";

class UpdateAdminUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private credentials: CredentialsRepository.Interface,
        private getUser: GetUserUseCase.Interface,
        private updateUser: CoreUpdateUser.Interface,
        private setPassword: SetPasswordUseCase.Interface
    ) {}

    async execute(
        id: string,
        input: UpdateAdminUserInput
    ): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = updateAdminUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.issues[0].message));
        }

        const { password, ...data } = validation.data;

        const found = await this.getUser.execute({ id });
        if (found.isFail()) {
            return Result.fail(found.error);
        }

        const original = found.value;

        if (data.email !== undefined && data.email !== original.email) {
            const taken = await this.credentials.getByEmail({ email: data.email });
            if (taken.isFail()) {
                return Result.fail(taken.error);
            }
            if (taken.value && taken.value.userId !== id) {
                return Result.fail(new AccountExistsError(data.email));
            }
        }

        const updated = await this.updateUser.execute(id, data);
        if (updated.isFail()) {
            return Result.fail(updated.error);
        }

        const user = updated.value;
        /*
         * Decided from what was stored, not from the input: api-core may not apply an email change,
         * and the credential must only follow the address the user record actually has.
         */
        const emailChanged = user.email !== original.email;

        const synced = await this.syncCredential(user, password, emailChanged);
        if (synced.isFail()) {
            /*
             * Signing in goes by the credential's address, so the user record must not move to an
             * address the credential does not have. Best effort: the original error is the one
             * worth reporting either way.
             */
            if (emailChanged) {
                await this.updateUser.execute(id, { email: original.email });
            }
            return Result.fail(synced.error);
        }

        return Result.ok(user);
    }

    private async syncCredential(
        user: AdminUser,
        password: string | undefined,
        emailChanged: boolean
    ) {
        if (password) {
            return this.setPassword.execute({ userId: user.id, email: user.email, password });
        }

        if (!emailChanged) {
            return Result.ok(true as const);
        }

        const found = await this.credentials.getByUserId({ userId: user.id });
        if (found.isFail()) {
            return Result.fail(found.error);
        }

        /*
         * A user without a credential has nothing to move. It still cannot sign in until an
         * administrator gives it a password, which is the same as before the update.
         */
        if (!found.value) {
            return Result.ok(true as const);
        }

        const updatedOn = new Date().toISOString();
        const credential = { ...found.value, email: user.email, updatedOn };

        return this.credentials.save({ credential });
    }
}

export const UpdateAdminUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateAdminUserUseCaseImpl,
    dependencies: [
        IdentityContext,
        CredentialsRepository,
        GetUserUseCase,
        CoreUpdateUser,
        SetPasswordUseCase
    ]
});
