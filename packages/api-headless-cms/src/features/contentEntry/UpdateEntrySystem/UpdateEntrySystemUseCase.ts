import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { UpdateEntrySystemUseCase as UseCaseAbstraction } from "./abstractions.js";
import { EntryAfterUpdateSystemEvent, EntryBeforeUpdateSystemEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/abstractions.js";
import { UpdateEntryRepository } from "../UpdateEntry/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel, ICmsEntrySystem } from "~/types/index.js";

class UpdateEntrySystemUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionByIdUseCase: GetRevisionByIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        system: Partial<ICmsEntrySystem>
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            const result = await this.getRevisionByIdUseCase.execute<T>(model, id);
            if (result.isFail()) {
                return Result.fail(result.error);
            }

            const original = result.value;
            const entry: CmsEntry<T> = {
                ...original,
                system: {
                    ...original.system,
                    ...system
                }
            };

            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry,
                rwd: "w"
            });
            if (!canAccessEntry) {
                return Result.fail(EntryNotAuthorizedError.fromModel(model));
            }

            await this.eventPublisher.publish(
                new EntryBeforeUpdateSystemEvent({ entry, original, system, model })
            );

            const updateResult = await this.repository.execute(model, entry);
            if (updateResult.isFail()) {
                return Result.fail(updateResult.error);
            }

            await this.eventPublisher.publish(
                new EntryAfterUpdateSystemEvent({ entry, original, system, model })
            );

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const UpdateEntrySystemUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateEntrySystemUseCaseImpl,
    dependencies: [EventPublisher, UpdateEntryRepository, AccessControl, GetRevisionByIdUseCase]
});
