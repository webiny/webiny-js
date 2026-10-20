import { createImplementation, Result } from "@webiny/feature/api";
import { EntryEventPublisher } from "~/features/contentEntry/EntryEventPublisher/index.js";
import { DuplicateEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { STATUS_DRAFT } from "~/features/contentEntry/entryDataFactories/statuses.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import {
    EntryAfterDuplicateEvent,
    EntryBeforeDuplicateEvent,
    EntryDuplicateErrorEvent
} from "./events.js";
import { prepareDuplicateValues } from "./prepareDuplicateValues.js";

class DuplicateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private eventPublisher: EntryEventPublisher.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        sourceId: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const originalResult = await this.getRevisionById.execute<T>(model, sourceId);
        if (originalResult.isFail()) {
            return Result.fail(originalResult.error);
        }

        const original = originalResult.value;

        /**
         * The duplicate is created by the current identity, so we must make sure the source entry
         * itself is accessible (e.g. "own" entries permission).
         */
        const canAccessOriginal = await this.accessControl.canAccessEntry({
            model,
            entry: original
        });
        if (!canAccessOriginal) {
            return Result.fail(EntryNotAuthorizedError.fromEntry(original));
        }

        try {
            await this.eventPublisher.publish(new EntryBeforeDuplicateEvent({ model, original }));

            const result = await this.createEntry.execute<T>(
                model,
                {
                    values: prepareDuplicateValues<T>(model, original.values),
                    location: {
                        folderId: original.location?.folderId
                    },
                    status: STATUS_DRAFT
                },
                {
                    // The duplicate is a draft, so validators (e.g. unique) are allowed to fail here.
                    skipValidation: true
                }
            );

            if (result.isFail()) {
                await this.eventPublisher.publish(
                    new EntryDuplicateErrorEvent({ model, original, error: result.error })
                );
                return Result.fail(result.error);
            }

            const entry = result.value;

            await this.eventPublisher.publish(
                new EntryAfterDuplicateEvent({ model, original, entry })
            );

            return Result.ok(entry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryDuplicateErrorEvent({ model, original, error: error as Error })
            );
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const DuplicateEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DuplicateEntryUseCaseImpl,
    dependencies: [AccessControl, GetRevisionByIdUseCase, CreateEntryUseCase, EntryEventPublisher]
});
