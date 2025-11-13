import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntryUseCase as UseCaseAbstraction, MoveEntryToBinUseCase } from "./abstractions.js";
import { DeleteEntryRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { CmsDeleteEntryOptions, CmsModel } from "~/types/index.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { EntryBeforeDeleteEvent, EntryAfterDeleteEvent, EntryDeleteErrorEvent } from "./events.js";
import { ContentEntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * DeleteEntryUseCase - Orchestrates permanent deletion of an entry.
 *
 * Responsibilities:
 * - Apply access control
 * - Get the entry to delete by ID
 * - Publish domain events
 * - Delegate to repository for storage operations
 */
class DeleteEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private moveEntryToBin: MoveEntryToBinUseCase.Interface,
        private repository: DeleteEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(
        model: CmsModel,
        id: string,
        options: CmsDeleteEntryOptions
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        const { permanently = true } = options;

        if (!permanently) {
            return this.moveEntryToBin.execute(model, id);
        }

        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "d" });
        if (!canAccess) {
            return Result.fail(ContentEntryNotAuthorizedError.fromModel(model));
        }

        // Get the entry to delete by ID
        const getResult = await this.getLatestRevision.execute(model, { id });

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const entryToDelete = getResult.value;

        // Check access control on the specific entry
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: entryToDelete,
            rwd: "d"
        });

        if (!canAccessEntry) {
            return Result.fail(new ContentEntryNotAuthorizedError());
        }

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new EntryBeforeDeleteEvent({
                    entry: entryToDelete,
                    model,
                    permanent: true
                })
            );

            // Delegate to repository
            const result = await this.repository.execute(model, entryToDelete);

            if (result.isFail()) {
                await this.eventPublisher.publish(
                    new EntryDeleteErrorEvent({
                        entry: entryToDelete,
                        model,
                        permanent: true,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterDeleteEvent({
                    entry: entryToDelete,
                    model,
                    permanent: true
                })
            );

            return Result.ok();
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryDeleteErrorEvent({
                    entry: entryToDelete,
                    model,
                    permanent: true,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const DeleteEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteEntryUseCaseImpl,
    dependencies: [
        MoveEntryToBinUseCase,
        DeleteEntryRepository,
        AccessControl,
        GetLatestRevisionByEntryIdIncludingDeletedUseCase,
        EventPublisher
    ]
});
