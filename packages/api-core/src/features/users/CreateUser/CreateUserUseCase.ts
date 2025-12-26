import { mdbid } from "@webiny/utils";
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { CreateUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { createUserValidation } from "./schema.js";
import {
    NotAuthorizedError,
    UserExistsError,
    UserValidationError
} from "~/features/users/shared/errors.js";
import { UserBeforeCreateEvent, UserAfterCreateEvent } from "./events.js";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { CreateUserInput } from "~/features/users/shared/types.js";
import type { CreatedBy } from "~/types/users.js";

class CreateUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(input: CreateUserInput): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        // 1. Check permission
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // 2. Validate input
        const validation = createUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.errors[0].message));
        }

        const data = validation.data;

        // 3. Check email uniqueness
        const existingUserResult = await this.repository.get({ email: data.email });
        if (existingUserResult.isOk()) {
            // This means the email is taken!
            return Result.fail(new UserExistsError(data.email));
        }

        if (existingUserResult.error.code !== "USER_NOT_FOUND") {
            return Result.fail(existingUserResult.error);
        }

        // 4. Generate ID if not provided
        const id = data.id || mdbid();

        // 5. Generate display name
        const displayName = this.getDisplayName(data);

        // 6. Get tenant and identity
        const tenant = this.tenantContext.getTenant().id;
        const identity = this.identityContext.getIdentity();

        let createdBy: CreatedBy | null = null;
        if (identity) {
            createdBy = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };
        }

        // 7. Create user entity
        const user: AdminUser = {
            ...data,
            id,
            email: data.email,
            displayName,
            createdOn: new Date().toISOString(),
            createdBy,
            tenant
        };

        // 8. Publish before event
        await this.eventPublisher.publish(new UserBeforeCreateEvent({ user, input: data }));

        // 10. Create user via repository
        const result = await this.repository.create(user);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        // 11. Publish after event
        await this.eventPublisher.publish(
            new UserAfterCreateEvent({ user: result.value, input: data })
        );

        return Result.ok(result.value);
    }

    private getDisplayName(data: CreateUserInput): string {
        // If display name is not set, try to get it from the first name and last name.
        // If first name and last name are not set, use the e-mail address.
        if (data.displayName) {
            return data.displayName;
        }

        if (data.firstName || data.lastName) {
            return `${data.firstName || ""} ${data.lastName || ""}`.trim();
        }

        if (data.email) {
            return data.email;
        }

        return "Missing display name";
    }
}

export const CreateUserUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateUserUseCaseImpl,
    dependencies: [TenantContext, IdentityContext, EventPublisher, AdminUsersRepository]
});
