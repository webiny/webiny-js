import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { DeleteMultipleEntriesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteMultipleEntriesRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { ListEntriesUseCase } from "~/features/contentEntry/ListEntries/abstractions.js";
import type { CmsModel } from "~/types/index.js";
import {
    EntryBeforeDeleteMultipleEvent,
    EntryAfterDeleteMultipleEvent,
    EntryDeleteMultipleErrorEvent
} from "./events.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { parseIdentifier } from "@webiny/utils";
import WebinyError from "@webiny/error";
import { filterAsync } from "~/utils/filterAsync.js";

/**
 * DeleteMultipleEntriesUseCase - Orchestrates deleting multiple entries.
 *
 * Responsibilities:
 * - Validate max entries limit (50)
 * - Parse entry IDs to unique entry IDs
 * - Apply access control
 * - Fetch entries using ListEntries use case
 * - Filter entries by access control
 * - Publish domain events
 * - Delegate to repository for storage operations
 */
class DeleteMultipleEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: DeleteMultipleEntriesRepository.Interface,
        private accessControl: AccessControl.Interface,
        private listEntries: ListEntriesUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(
        model: CmsModel,
        params: { entries: string[] }
    ): Promise<Result<Array<{ id: string }>, UseCaseAbstraction.Error>> {
        const { entries: input } = params;
        const maxDeletableEntries = 50;

        // Parse entry IDs to unique entry IDs
        const entryIdList = new Set<string>();
        for (const id of input) {
            const { id: entryId } = parseIdentifier(id);
            entryIdList.add(entryId);
        }
        const ids = Array.from(entryIdList);

        // Validate max entries limit
        if (ids.length > maxDeletableEntries) {
            return Result.fail(
                new WebinyError(
                    "Cannot delete more than 50 entries at once.",
                    "DELETE_ENTRIES_MAX",
                    {
                        entries: ids
                    }
                ) as any
            );
        }

        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "d" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        // Fetch entries using ListEntries use case
        const listResult = await this.listEntries.execute(model, {
            where: {
                latest: true,
                entryId_in: ids
            },
            limit: maxDeletableEntries + 1
        });

        if (listResult.isFail()) {
            return Result.fail(listResult.error);
        }

        const { entries } = listResult.value;

        // Filter entries by access control (only delete entries user can access)
        const accessibleEntries = await filterAsync(entries, async entry => {
            return this.accessControl.canAccessEntry({ model, entry });
        });

        const items = accessibleEntries.map(entry => entry.id);

        try {
            // Publish before event
            await this.eventPublisher.publish(
                new EntryBeforeDeleteMultipleEvent({
                    entries,
                    ids,
                    model
                })
            );

            // Delegate to repository
            const result = await this.repository.execute(model, items);

            if (result.isFail()) {
                await this.eventPublisher.publish(
                    new EntryDeleteMultipleErrorEvent({
                        entries,
                        ids,
                        model,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterDeleteMultipleEvent({
                    entries,
                    ids,
                    model
                })
            );

            return Result.ok(
                items.map(id => {
                    return { id };
                })
            );
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryDeleteMultipleErrorEvent({
                    entries,
                    ids,
                    model,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const DeleteMultipleEntriesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteMultipleEntriesUseCaseImpl,
    dependencies: [
        DeleteMultipleEntriesRepository,
        AccessControl,
        ListEntriesUseCase,
        EventPublisher
    ]
});
