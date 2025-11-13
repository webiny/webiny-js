import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { CreateGroupUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateGroupRepository } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { GroupBeforeCreateEvent } from "./events.js";
import { GroupAfterCreateEvent } from "./events.js";
import { GroupCreateErrorEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { CmsContext } from "~/features/shared/abstractions.js";
import { GroupValidationError } from "~/domain/contentModelGroup/errors.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { createZodError } from "@webiny/utils";
import { mdbid } from "@webiny/utils";
import { createGroupCreateValidation } from "~/crud/contentModelGroup/validation.js";
import type { CmsGroup } from "~/types/index.js";
import type { CmsGroupCreateInput } from "~/types/index.js";

/**
 * CreateGroupUseCase - Orchestrates group creation.
 *
 * Responsibilities:
 * - Validate input (Zod)
 * - Create domain group object
 * - Access control checks
 * - Publish before event
 * - Delegate to repository
 * - Publish after event or error event
 */
class CreateGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateGroupRepository.Interface,
        private accessControl: AccessControl.Interface,
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(
        input: CmsGroupCreateInput
    ): Promise<Result<CmsGroup, UseCaseAbstraction.Error>> {
        // Initial access control check
        const canAccess = await this.accessControl.canAccessGroup({ rwd: "w" });
        if (!canAccess) {
            return Result.fail(new NotAuthorizedError());
        }

        // Validate input
        const validationResult = await createGroupCreateValidation().safeParseAsync(input);
        if (!validationResult.success) {
            const zodError = createZodError(validationResult.error);
            return Result.fail(new GroupValidationError(zodError.message));
        }
        const data = validationResult.data;

        // Create domain group object
        const identity = this.identityContext.getIdentity();
        const tenant = this.tenantContext.getTenant();

        const id = data.id || mdbid();
        const group: CmsGroup = {
            ...data,
            id,
            tenant: tenant.id,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            createdBy: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            webinyVersion: this.cmsContext.WEBINY_VERSION
        };

        // Access control check on created group
        const canAccessGroup = await this.accessControl.canAccessGroup({ group, rwd: "w" });
        if (!canAccessGroup) {
            return Result.fail(new NotAuthorizedError());
        }

        try {
            // Publish before event
            await this.eventPublisher.publish(new GroupBeforeCreateEvent({ group }));

            // Persist via repository
            const result = await this.repository.execute(group);
            if (result.isFail()) {
                // Publish error event
                await this.eventPublisher.publish(
                    new GroupCreateErrorEvent({
                        input,
                        group,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            // Publish after event
            await this.eventPublisher.publish(new GroupAfterCreateEvent({ group }));

            return Result.ok(group);
        } catch (error) {
            // Publish error event for unexpected errors
            await this.eventPublisher.publish(
                new GroupCreateErrorEvent({
                    input,
                    group,
                    error: error as Error
                })
            );
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const CreateGroupUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateGroupUseCaseImpl,
    dependencies: [
        EventPublisher,
        CreateGroupRepository,
        AccessControl,
        TenantContext,
        IdentityContext,
        CmsContext
    ]
});
