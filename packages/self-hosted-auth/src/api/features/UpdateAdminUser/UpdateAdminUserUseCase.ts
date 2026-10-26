import { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { UserValidationError } from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { UpdateUserUseCase as CoreUpdateUser } from "@webiny/api-core/features/users/UpdateUser/index.js";
import { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";
import { UpdateAdminUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { UpdateAdminUserInput } from "./abstractions.js";
import { updateAdminUserValidation } from "./schema.js";

class UpdateAdminUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
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

        /*
         * The email is the account's sign-in key, so it is fixed once the user exists. api-core
         * would drop it silently; saying so is better than reporting a change that did not happen.
         * The forms send the current address back unchanged, which is not a change.
         */
        if (data.email !== undefined && data.email !== found.value.email) {
            return Result.fail(new UserValidationError("The email address cannot be changed."));
        }

        const updated = await this.updateUser.execute(id, data);
        if (updated.isFail()) {
            return Result.fail(updated.error);
        }

        const user = updated.value;

        if (password) {
            const passwordSet = await this.setPassword.execute({
                userId: user.id,
                email: user.email,
                password
            });
            if (passwordSet.isFail()) {
                return Result.fail(passwordSet.error);
            }
        }

        return Result.ok(user);
    }
}

export const UpdateAdminUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateAdminUserUseCaseImpl,
    dependencies: [IdentityContext, GetUserUseCase, CoreUpdateUser, SetPasswordUseCase]
});
