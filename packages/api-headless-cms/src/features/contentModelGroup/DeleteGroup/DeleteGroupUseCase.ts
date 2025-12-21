import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { DeleteGroupUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteGroupRepository } from "./abstractions.js";
import { GetGroupUseCase } from "~/features/contentModelGroup/GetGroup/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { GroupBeforeDeleteEvent } from "./events.js";
import { GroupAfterDeleteEvent } from "./events.js";
import { GroupDeleteErrorEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GroupNotAuthorizedError } from "~/domain/contentModelGroup/errors.js";

/**
 * DeleteGroupUseCase - Orchestrates group deletion.
 *
 * Responsibilities:
 * - Fetch original group
 * - Access control checks
 * - Publish before event
 * - Delegate to repository
 * - Publish after event or error event
 */
class DeleteGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: DeleteGroupRepository.Interface,
        private getGroupUseCase: GetGroupUseCase.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute(groupId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Initial access control check
        const canAccess = await this.accessControl.canAccessGroup({ rwd: "d" });
        if (!canAccess) {
            return Result.fail(new GroupNotAuthorizedError());
        }

        // Fetch original group
        const getResult = await this.getGroupUseCase.execute(groupId);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }
        const group = getResult.value;

        // Access control check on group
        const canAccessGroup = await this.accessControl.canAccessGroup({ group });
        if (!canAccessGroup) {
            return Result.fail(new GroupNotAuthorizedError());
        }

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new GroupBeforeDeleteEvent({
                    group
                })
            );

            // Persist via repository
            const result = await this.repository.execute(group);
            if (result.isFail()) {
                // Publish error event
                await this.eventPublisher.publish(
                    new GroupDeleteErrorEvent({
                        group,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new GroupAfterDeleteEvent({
                    group
                })
            );

            return Result.ok();
        } catch (error) {
            // Publish error event for unexpected errors
            await this.eventPublisher.publish(
                new GroupDeleteErrorEvent({
                    group,
                    error: error as Error
                })
            );
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const DeleteGroupUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteGroupUseCaseImpl,
    dependencies: [EventPublisher, DeleteGroupRepository, GetGroupUseCase, AccessControl]
});
