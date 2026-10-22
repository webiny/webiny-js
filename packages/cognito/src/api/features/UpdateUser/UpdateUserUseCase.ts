import { Result } from "@webiny/feature/api";
import { UpdateUserUseCase as CoreUpdateUser } from "@webiny/api-core/features/users/UpdateUser/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { FindUserRecordsUseCase } from "@webiny/api-core/features/users/FindUserRecords/index.js";
import { AdminUsersRepository } from "@webiny/api-core/features/users/shared/abstractions.js";
import {
    EmailTakenError,
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoSharedAccountError, CognitoUpdateUserError } from "~/api/domain/errors.js";
import { updateAdminUserValidation } from "./schema.js";
import type { UpdateAdminUserInput } from "./abstractions.js";
import { CognitoService } from "~/api/features/CognitoService/index.js";

type MappedAttrType = (user: AdminUser) => string | keyof AdminUser;

const defaultUpdateAttributes = {
    family_name: "lastName",
    given_name: "firstName",
    preferred_username: "email"
};

class UpdateUserUseCaseImpl implements UseCaseAbstraction.Interface {
    private updateAttributes: Record<string, string | MappedAttrType>;

    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private updateUserUseCase: CoreUpdateUser.Interface,
        private getUserUseCase: GetUserUseCase.Interface,
        private findUserRecords: FindUserRecordsUseCase.Interface,
        private repository: AdminUsersRepository.Interface
    ) {
        this.updateAttributes = defaultUpdateAttributes;
    }

    async execute(
        id: string,
        input: UpdateAdminUserInput
    ): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // Validate input (including password)
        const validation = updateAdminUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.issues[0].message));
        }

        const data = validation.data;
        const { password, ...userDataWithoutPassword } = data;

        // Get original user to know the email before update
        const getUserResult = await this.getUserUseCase.execute({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const originalUser = getUserResult.value;

        /**
         * Name, email and password belong to the person's sign-in account, which all of their
         * tenants share. In a shared account, only the person changes them, and every tenant's
         * record gets the new name and email.
         */
        const profileChanged =
            (data.email !== undefined && data.email !== originalUser.email) ||
            (data.firstName !== undefined && data.firstName !== originalUser.firstName) ||
            (data.lastName !== undefined && data.lastName !== originalUser.lastName);

        let otherRecords: AdminUser[] = [];
        if (profileChanged || password) {
            const recordsResult = await this.findUserRecords.execute(id, { exhaustive: true });
            if (recordsResult.isFail()) {
                return Result.fail(recordsResult.error);
            }

            otherRecords = recordsResult.value.filter(
                record => record.tenant !== originalUser.tenant
            );

            const isSelf = this.identityContext.getIdentity().id === id;
            if (otherRecords.length > 0 && !isSelf) {
                return Result.fail(new CognitoSharedAccountError(id));
            }

            // The new email goes to every tenant's record, so it must be free in all of them.
            if (data.email !== undefined && data.email !== originalUser.email) {
                const emailResult = await this.ensureEmailIsFree(id, data.email, otherRecords);
                if (emailResult.isFail()) {
                    return Result.fail(emailResult.error);
                }
            }
        }

        // Update user in api-core
        const updateUserResult = await this.updateUserUseCase.execute(id, userDataWithoutPassword);
        if (updateUserResult.isFail()) {
            return Result.fail(updateUserResult.error);
        }

        const updatedUser = updateUserResult.value;

        // Sync the other records before Cognito, so a failed sync leaves the sign-in account as it was.
        if (profileChanged) {
            const syncResult = await this.syncProfile(updatedUser, otherRecords);
            if (syncResult.isFail()) {
                return Result.fail(syncResult.error);
            }
        }

        // Update user in Cognito
        try {
            // Build new attributes
            const attributes: Record<string, string> = {};

            Object.keys(this.updateAttributes).forEach(attr => {
                const mappedAttr = this.updateAttributes[
                    attr as keyof typeof this.updateAttributes
                ] as MappedAttrType;
                const attrValue =
                    typeof mappedAttr === "function"
                        ? mappedAttr(updatedUser)
                        : updatedUser[mappedAttr];
                attributes[attr] = attrValue;
            });

            // If email changed, set email_verified to true
            if (originalUser.email !== updatedUser.email) {
                attributes["email_verified"] = "true";
            }

            await this.cognitoService.updateUserAttributes(
                Username.fromUser(originalUser),
                attributes
            );

            // Update password if provided
            if (password) {
                await this.cognitoService.setPermanentPassword(
                    Username.fromUser(updatedUser),
                    password
                );
            }

            return Result.ok(updatedUser);
        } catch (cognitoError) {
            return Result.fail(new CognitoUpdateUserError(cognitoError as Error));
        }
    }

    private async ensureEmailIsFree(
        id: string,
        email: string,
        records: AdminUser[]
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        const results = await Promise.all(
            records.map(record => this.repository.get({ email, tenant: record.tenant }))
        );

        for (const result of results) {
            if (result.isOk()) {
                if (result.value.id !== id) {
                    return Result.fail(new EmailTakenError(email));
                }
                continue;
            }

            if (result.error.code !== "AdminUser/NotFound") {
                return Result.fail(result.error);
            }
        }

        return Result.ok();
    }

    private async syncProfile(
        user: AdminUser,
        records: AdminUser[]
    ): Promise<Result<void, AdminUsersRepository.Error>> {
        const results = await Promise.all(
            records.map(record => {
                return this.repository.update({
                    ...record,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    displayName: user.displayName
                });
            })
        );

        const failed = results.find(result => result.isFail());
        if (failed && failed.isFail()) {
            return Result.fail(failed.error);
        }

        return Result.ok();
    }
}

export const UpdateUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateUserUseCaseImpl,
    dependencies: [
        IdentityContext,
        CognitoService,
        CoreUpdateUser,
        GetUserUseCase,
        FindUserRecordsUseCase,
        AdminUsersRepository
    ]
});
