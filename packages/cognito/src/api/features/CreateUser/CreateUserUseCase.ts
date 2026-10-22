import { Result } from "@webiny/feature/api";
import { AdminUsersRepository } from "@webiny/api-core/features/users/shared/abstractions.js";
import {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CreateUserUseCase as CoreCreateUser } from "@webiny/api-core/features/users/CreateUser/index.js";
import { FindUserRecordsUseCase } from "@webiny/api-core/features/users/FindUserRecords/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";

import { CreateUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoAccountExistsError, CognitoCreateUserError } from "~/api/domain/errors.js";
import { createAdminUserValidation } from "./schema.js";
import type { CreateAdminUserInput } from "./abstractions.js";
import { CognitoService } from "~/api/features/CognitoService/index.js";

type ValidatedInput = Omit<CreateAdminUserInput, "password">;

class CreateUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private cognitoService: CognitoService.Interface,
        private createUserUseCase: CoreCreateUser.Interface,
        private listUsersUseCase: ListUsersUseCase.Interface,
        private findUserRecords: FindUserRecordsUseCase.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(
        input: CreateAdminUserInput
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // Validate input (including password)
        const validation = createAdminUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.issues[0].message));
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
            // An account that already exists (in another tenant) is added to this tenant.
            const cognitoUser = await this.cognitoService.getUser(username);
            if (cognitoUser) {
                return await this.addExistingAccount(cognitoUser, userDataWithoutPassword);
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

    /**
     * Creates the user in this tenant with the account's ID, so the account signs in here too.
     * The account itself (password, attributes) is left as it is. Name and email are global per
     * person, so they come from the person's other records, or from the account.
     */
    private async addExistingAccount(
        cognitoUser: CognitoService.User,
        data: ValidatedInput
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        const id = cognitoUser.attributes["custom:id"];
        if (!id) {
            // Not an account this app created, so there's no user ID to share.
            return Result.fail(new CognitoAccountExistsError(data.email));
        }

        // Exhaustive, so records from before the user→tenant index get indexed now.
        const recordsResult = await this.findUserRecords.execute(id, { exhaustive: true });
        if (recordsResult.isFail()) {
            return Result.fail(recordsResult.error);
        }

        const records = recordsResult.value;
        const currentTenant = this.tenantContext.getTenant().id;
        if (records.some(record => record.tenant === currentTenant)) {
            return Result.fail(new CognitoAccountExistsError(data.email));
        }

        const [existing] = records;
        const createUserResult = await this.createUserUseCase.execute({
            ...data,
            id,
            email: existing?.email ?? data.email,
            firstName:
                existing?.firstName ?? (cognitoUser.attributes["given_name"] || data.firstName),
            lastName:
                existing?.lastName ?? (cognitoUser.attributes["family_name"] || data.lastName),
            displayName: existing?.displayName ?? data.displayName
        });

        if (createUserResult.isFail()) {
            return Result.fail(createUserResult.error);
        }

        return Result.ok({ ...createUserResult.value, existingAccount: true });
    }
}

export const CreateUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateUserUseCaseImpl,
    dependencies: [
        IdentityContext,
        TenantContext,
        CognitoService,
        CoreCreateUser,
        ListUsersUseCase,
        FindUserRecordsUseCase,
        AdminUsersRepository
    ]
});
