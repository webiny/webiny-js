import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { MoveEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { MoveEntryRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryBeforeMoveEvent, EntryAfterMoveEvent, EntryMoveErrorEvent } from "./events.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";

/**
 * MoveEntryUseCase - Orchestrates moving an entry to a different folder.
 *
 * Responsibilities:
 * - Apply access control
 * - Get the entry to move
 * - Check if entry is already in target folder (early return)
 * - Publish domain events
 * - Delegate to repository for storage operations
 */
class MoveEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: MoveEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        folderId: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        // Get the entry to move
        const result = await this.getRevisionById.execute<T>(model, id);

        if (result.isFail()) {
            return Result.fail(new EntryNotFoundError(id));
        }

        const entry = result.value;

        // Check access control on the specific entry
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry,
            rwd: "w"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        // Early return if entry is already in the requested folder
        if (entry.location?.folderId === folderId) {
            return Result.ok(entry);
        }

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new EntryBeforeMoveEvent({
                    entry,
                    model,
                    folderId
                })
            );

            // Delegate to repository
            const moveResult = await this.repository.execute(model, id, folderId);

            if (moveResult.isFail()) {
                await this.eventPublisher.publish(
                    new EntryMoveErrorEvent({
                        entry,
                        model,
                        folderId,
                        error: moveResult.error
                    })
                );
                return Result.fail(moveResult.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterMoveEvent({
                    entry,
                    model,
                    folderId
                })
            );

            return Result.ok(entry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryMoveErrorEvent({
                    entry,
                    model,
                    folderId,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const MoveEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: MoveEntryUseCaseImpl,
    dependencies: [MoveEntryRepository, AccessControl, GetRevisionByIdUseCase, EventPublisher]
});
