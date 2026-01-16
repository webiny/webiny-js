import { Result } from "@webiny/feature/api";
import { CreateUserUseCase } from "@webiny/api-core/features/CreateUser";
import { ListUsersUseCase } from "@webiny/api-core/features/ListUsers";
import { AdminUsersRepository } from "@webiny/api-core/features/users/shared/abstractions.js";
import {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import { CreateAdminUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CognitoService } from "../shared/abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoAccountExistsError, CognitoCreateUserError } from "~/api/domain/errors.js";
import { createAdminUserValidation } from "./schema.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type { CreateAdminUserInput } from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class CreateAdminUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private createUserUseCase: CreateUserUseCase.Interface,
        private listUsersUseCase: ListUsersUseCase.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(
        input: CreateAdminUserInput
    ): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // Validate input (including password)
        const validation = createAdminUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.errors[0].message));
        }

        const data = validation.data;
        const { password, ...userDataWithoutPassword } = data;

        const username = Username.fromUser(data);

        // Check if user exists in database (faster than Cognito check)
        const existingUserResult = await this.repository.get({ email: data.email });
        if (existingUserResult.isOk()) {
            return Result.fail(new CognitoAccountExistsError(data.email));
        }

        let user: AdminUser | undefined = undefined;

        try {
            // Check if user exists in Cognito
            const userExists = await this.cognitoService.userExists(username);
            if (userExists) {
                return Result.fail(new CognitoAccountExistsError(data.email));
            }
            // Create user in api-core
            const createUserResult = await this.createUserUseCase.execute(userDataWithoutPassword);
            if (createUserResult.isFail()) {
                return Result.fail(createUserResult.error);
            }

            user = createUserResult.value;

            // Create user in Cognito
            await this.cognitoService.createUser({
                username,
                temporaryPassword: password,
                attributes: {
                    givenName: data.firstName,
                    familyName: data.lastName,
                    preferredUsername: username,
                    email: username,
                    customId: user.id
                }
            });

            // Set email as verified
            await this.cognitoService.setEmailVerified(username);

            // Check if this is the first user in the system, and if so, set permanent password
            const usersResult = await this.listUsersUseCase.execute();
            if (usersResult.isFail()) {
                // Log error but don't fail the operation
                console.error(`Failed to list users: ${usersResult.error.message}`);
            } else {
                const users = usersResult.value;
                if (users.length <= 1) {
                    // This is the first user, set permanent password
                    await this.cognitoService.setPermanentPassword(username, password);
                }
            }

            return Result.ok(user);
        } catch (cognitoError) {
            if (user) {
                // Rollback: Delete user from api-core if Cognito creation failed
                try {
                    await this.repository.delete(user);
                } catch (rollbackError) {
                    console.error("Failed to rollback user creation:", rollbackError);
                }
            }
            return Result.fail(new CognitoCreateUserError(cognitoError as Error));
        }
    }
}

export const CreateAdminUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateAdminUserUseCaseImpl,
    dependencies: [
        IdentityContext,
        CognitoService,
        CreateUserUseCase,
        ListUsersUseCase,
        AdminUsersRepository
    ]
});
