import { Result } from "@webiny/feature/api";
import { UpdateUserUseCase as CoreUpdateUser } from "@webiny/api-core/features/users/UpdateUser/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { FindUserRecordsUseCase } from "@webiny/api-core/features/users/FindUserRecords/index.js";
import { AdminUsersRepository } from "@webiny/api-core/features/users/shared/abstractions.js";
import {
    NotAuthorizedError,
    UserStorageError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TenantScopes } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import {
    CognitoSharedAccountError,
    CognitoUpdateRollbackError,
    CognitoUpdateUserError
} from "~/api/domain/errors.js";
import { updateAdminUserValidation } from "./schema.js";
import type { UpdateAdminUserInput } from "./abstractions.js";
import { CognitoService } from "~/api/features/CognitoService/index.js";

type MappedAttrType = (user: AdminUser) => string | keyof AdminUser;

const defaultUpdateAttributes = {
    family_name: "lastName",
    given_name: "firstName",
    preferred_username: "email"
};

/**
 * How long to wait, in milliseconds, before each retry of a rollback write that failed.
 */
const ROLLBACK_RETRY_DELAYS = [100, 400];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class UpdateUserUseCaseImpl implements UseCaseAbstraction.Interface {
    private updateAttributes: Record<string, string | MappedAttrType>;

    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private updateUserUseCase: CoreUpdateUser.Interface,
        private getUserUseCase: GetUserUseCase.Interface,
        private findUserRecords: FindUserRecordsUseCase.Interface,
        private repository: AdminUsersRepository.Interface,
        private tenantContext: TenantContext.Interface,
        private tenantScopes: TenantScopes.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface
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

        /*
         * The email is the user pool username, which Cognito cannot change, and the sign-in key.
         * api-core would drop it silently; saying so is better than reporting a change that did not
         * happen. The forms send the current address back unchanged, which is not a change.
         */
        if (data.email !== undefined && data.email !== originalUser.email) {
            return Result.fail(new UserValidationError("The email address cannot be changed."));
        }

        /**
         * Name, email and password belong to the person's sign-in account, which all of their
         * tenants share. In a shared account, only the person changes them, and every tenant's
         * record gets the new name and email.
         */
        const profileChanged =
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
        }

        // Update user in api-core
        const updateUserResult = await this.updateUserUseCase.execute(id, userDataWithoutPassword);
        if (updateUserResult.isFail()) {
            return Result.fail(updateUserResult.error);
        }

        const updatedUser = updateUserResult.value;

        /**
         * The records are written before Cognito, so a failed write never touches the sign-in
         * account. If the sync or Cognito fails, every record goes back to how it was, so the
         * records keep matching the sign-in account. A record that can't be put back is retried
         * with a backoff; if it still fails, the error names its tenant.
         */
        const writtenRecords = profileChanged ? [originalUser, ...otherRecords] : [originalUser];

        if (profileChanged) {
            const syncResult = await this.syncProfile(updatedUser, otherRecords);
            if (syncResult.isFail()) {
                return this.rollback(writtenRecords, syncResult.error);
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

            await this.cognitoService.updateUserAttributes(
                Username.fromUser(originalUser),
                attributes
            );
        } catch (cognitoError) {
            return this.rollback(writtenRecords, new CognitoUpdateUserError(cognitoError as Error));
        }

        // The name and email are now in Cognito, so a failed password change keeps the records.
        try {
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

    private async syncProfile(
        user: AdminUser,
        records: AdminUser[]
    ): Promise<Result<void, AdminUsersRepository.Error>> {
        return this.writeRecords(
            records.map(record => ({
                ...record,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName
            }))
        );
    }

    /**
     * Puts the records back and fails with the original error. A record that can't be put back
     * is tried again after each delay in `ROLLBACK_RETRY_DELAYS`. When some records still can't
     * be put back, the error says which tenants no longer match the Cognito account.
     */
    private async rollback(
        records: AdminUser[],
        error: UseCaseAbstraction.Error
    ): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        let pending = records;
        let rollbackErrors: Error[] = [];

        for (let attempt = 0; ; attempt++) {
            const results = await Promise.all(pending.map(record => this.updateRecord(record)));

            const failed: AdminUser[] = [];
            rollbackErrors = [];
            results.forEach((result, index) => {
                if (result.isFail()) {
                    failed.push(pending[index]);
                    rollbackErrors.push(result.error);
                }
            });

            pending = failed;
            if (pending.length === 0 || attempt >= ROLLBACK_RETRY_DELAYS.length) {
                break;
            }

            await sleep(ROLLBACK_RETRY_DELAYS[attempt]);
        }

        if (pending.length > 0) {
            return Result.fail(
                new CognitoUpdateRollbackError(
                    error,
                    pending.map(record => record.tenant),
                    rollbackErrors
                )
            );
        }

        return Result.fail(error);
    }

    /**
     * Writes a record in its own tenant's scope: the person's records in other tenants are written
     * by those tenants' storage.
     */
    private async updateRecord(
        record: AdminUser
    ): Promise<Result<AdminUser, AdminUsersRepository.Error>> {
        if (record.tenant === this.tenantContext.getTenant().id) {
            return this.repository.update(record);
        }

        const tenantResult = await this.getTenantById.execute(record.tenant);
        if (tenantResult.isFail()) {
            const error = tenantResult.error;
            return Result.fail(
                new UserStorageError(
                    error.type === "UNKNOWN"
                        ? error.cause
                        : new Error(`Tenant "${record.tenant}" was not found.`)
                )
            );
        }

        try {
            return await this.tenantScopes.withTenant(tenantResult.value, scope => {
                return scope.resolve(AdminUsersRepository).update(record);
            });
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    private async writeRecords(
        records: AdminUser[]
    ): Promise<Result<void, AdminUsersRepository.Error>> {
        const results = await Promise.all(records.map(record => this.updateRecord(record)));

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
        AdminUsersRepository,
        TenantContext,
        TenantScopes,
        GetTenantByIdUseCase
    ]
});
