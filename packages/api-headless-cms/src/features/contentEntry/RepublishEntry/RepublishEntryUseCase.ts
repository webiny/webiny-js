import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { RepublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RepublishEntryRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import {
    EntryBeforeRepublishEvent,
    EntryAfterRepublishEvent,
    EntryRepublishErrorEvent
} from "./events.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { CreateRepublishEntryDataFactory } from "~/features/contentEntry/entryDataFactories/CreateRepublishEntryDataFactory/index.js";

class RepublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: RepublishEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private createRepublishEntryDataFactory: CreateRepublishEntryDataFactory.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w", pw: "p" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const result = await this.getRevisionById.execute<T>(model, id);

        if (result.isFail()) {
            return Result.fail(new EntryNotFoundError(id));
        }

        const originalEntry = result.value;

        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: originalEntry,
            rwd: "w",
            pw: "p"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const { entry } = await this.createRepublishEntryDataFactory.create<T>(
            model,
            originalEntry
        );

        try {
            await this.eventPublisher.publish(
                new EntryBeforeRepublishEvent({
                    entry,
                    model
                })
            );

            const repositoryResult = await this.repository.execute<T>(model, entry);

            if (repositoryResult.isFail()) {
                await this.eventPublisher.publish(
                    new EntryRepublishErrorEvent({
                        entry,
                        model,
                        error: repositoryResult.error
                    })
                );
                return Result.fail(repositoryResult.error);
            }

            const publishedEntry = repositoryResult.value;

            await this.eventPublisher.publish(
                new EntryAfterRepublishEvent({
                    entry: publishedEntry,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryRepublishErrorEvent({
                    entry,
                    model,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const RepublishEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: RepublishEntryUseCaseImpl,
    dependencies: [
        RepublishEntryRepository,
        AccessControl,
        GetRevisionByIdUseCase,
        EventPublisher,
        CreateRepublishEntryDataFactory
    ]
});
