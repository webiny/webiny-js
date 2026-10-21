import { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateUserUseCase as CoreCreateUser } from "@webiny/api-core/features/users/CreateUser/index.js";
import { DeleteUserUseCase as CoreDeleteUser } from "@webiny/api-core/features/users/DeleteUser/index.js";
import { AccountExistsError } from "~/api/domain/errors.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";
import { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";
import { CreateAdminUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { CreateAdminUserInput } from "./abstractions.js";
import { createAdminUserValidation } from "./schema.js";

class CreateAdminUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private credentials: CredentialsRepository.Interface,
        private createUser: CoreCreateUser.Interface,
        private deleteUser: CoreDeleteUser.Interface,
        private setPassword: SetPasswordUseCase.Interface
    ) {}

    async execute(
        input: CreateAdminUserInput
    ): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = createAdminUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.issues[0].message));
        }

        const { password, ...data } = validation.data;

        // api-core only checks the address within the current tenant. Credentials are global, so a
        // user in another tenant can already hold it, and the save below would hit the unique key.
        const existing = await this.credentials.getByEmail({ email: data.email });
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        if (existing.value) {
            return Result.fail(new AccountExistsError(data.email));
        }

        const created = await this.createUser.execute(data);
        if (created.isFail()) {
            return Result.fail(created.error);
        }

        const user = created.value;

        const passwordSet = await this.setPassword.execute({
            userId: user.id,
            email: user.email,
            password
        });
        if (passwordSet.isFail()) {
            // A user with no password cannot sign in and blocks its own address, so it goes too.
            await this.deleteUser.execute(user.id);
            return Result.fail(passwordSet.error);
        }

        return Result.ok(user);
    }
}

export const CreateAdminUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateAdminUserUseCaseImpl,
    dependencies: [
        IdentityContext,
        CredentialsRepository,
        CoreCreateUser,
        CoreDeleteUser,
        SetPasswordUseCase
    ]
});
