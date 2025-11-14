import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UpdateGroupUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateGroupRepository } from "./abstractions.js";
import { GetGroupUseCase } from "~/features/contentModelGroup/GetGroup/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { GroupBeforeUpdateEvent } from "./events.js";
import { GroupAfterUpdateEvent } from "./events.js";
import { GroupUpdateErrorEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { GroupNotAuthorizedError, GroupValidationError } from "~/domain/contentModelGroup/errors.js";
import { createZodError } from "@webiny/utils";
import { createGroupUpdateValidation } from "~/domain/contentModelGroup/validation.js";
import type { CmsGroup } from "~/types/index.js";
import type { CmsGroupUpdateInput } from "~/types/index.js";

/**
 * UpdateGroupUseCase - Orchestrates group updates.
 *
 * Responsibilities:
 * - Fetch original group
 * - Access control checks
 * - Validate input (Zod)
 * - Skip if no changes
 * - Merge changes
 * - Publish before event
 * - Delegate to repository
 * - Publish after event or error event
 */
class UpdateGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateGroupRepository.Interface,
        private getGroupUseCase: GetGroupUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async execute(
        groupId: string,
        input: CmsGroupUpdateInput
    ): Promise<Result<CmsGroup, UseCaseAbstraction.Error>> {
        // Initial access control check
        const canAccess = await this.accessControl.canAccessGroup({ rwd: "w" });
        if (!canAccess) {
            return Result.fail(new GroupNotAuthorizedError());
        }

        // Fetch original group
        const getResult = await this.getGroupUseCase.execute(groupId);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }
        const original = getResult.value;

        // Access control check on original group
        const canAccessGroup = await this.accessControl.canAccessGroup({ group: original });
        if (!canAccessGroup) {
            return Result.fail(new GroupNotAuthorizedError());
        }

        // Validate input
        const validationResult = await createGroupUpdateValidation().safeParseAsync(input);
        if (!validationResult.success) {
            const zodError = createZodError(validationResult.error);
            return Result.fail(new GroupValidationError(zodError.message, zodError.data!.invalidFields));
        }
        const data = validationResult.data;

        // Skip if no changes
        if (Object.keys(data).length === 0) {
            return Result.ok(original);
        }

        // Merge changes
        const tenant = this.tenantContext.getTenant();
        const group: CmsGroup = {
            ...original,
            ...data,
            tenant: tenant.id,
            savedOn: new Date().toISOString()
        };

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new GroupBeforeUpdateEvent({
                    original,
                    group
                })
            );

            // Persist via repository
            const result = await this.repository.execute(group);
            if (result.isFail()) {
                // Publish error event
                await this.eventPublisher.publish(
                    new GroupUpdateErrorEvent({
                        input,
                        original,
                        group,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new GroupAfterUpdateEvent({
                    original,
                    group
                })
            );

            return Result.ok(group);
        } catch (error) {
            // Publish error event for unexpected errors
            await this.eventPublisher.publish(
                new GroupUpdateErrorEvent({
                    input,
                    original,
                    group,
                    error: error as Error
                })
            );
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const UpdateGroupUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UpdateGroupUseCaseImpl,
    dependencies: [
        EventPublisher,
        UpdateGroupRepository,
        GetGroupUseCase,
        AccessControl,
        TenantContext
    ]
});
