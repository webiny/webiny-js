import { Result } from "@webiny/feature/api";
import { AccessControl } from "~/features/shared/abstractions.js";
import { CreateSimpleEntryDataFactory } from "~/features/simpleContentEntries/entryDataFactories/createSimpleEntryData/index.js";
import {
    SimpleEntryNotAuthorizedError,
    SimpleEntryValidationError
} from "~/features/simpleContentEntries/domain/errors/index.js";
import type {
    ICreateSimpleEntryInput,
    ISimpleCmsEntry
} from "~/features/simpleContentEntries/types.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import {
    CreateSimpleEntryRepository,
    CreateSimpleEntryUseCase as UseCaseAbstraction
} from "./abstractions/index.js";

class CreateSimpleEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: CreateSimpleEntryRepository.Interface,
        private readonly accessControl: AccessControl.Interface,
        private readonly dataFactory: CreateSimpleEntryDataFactory.Interface
    ) {}

    public async execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        input: ICreateSimpleEntryInput<TValues>
    ): Promise<Result<ISimpleCmsEntry<TValues>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(SimpleEntryNotAuthorizedError.fromModel(model));
        }

        try {
            const { entry } = await this.dataFactory.create<TValues>(model, input);

            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry: entry as unknown as CmsEntry,
                rwd: "w"
            });
            if (!canAccessEntry) {
                return Result.fail(SimpleEntryNotAuthorizedError.fromEntry(entry));
            }

            const result = await this.repository.execute(model, entry);
            if (result.isFail()) {
                return Result.fail(result.error);
            }

            return Result.ok(entry);
        } catch (error) {
            if (error.code === "VALIDATION_FAILED") {
                return Result.fail(new SimpleEntryValidationError(error.message, error.data));
            }
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const CreateSimpleEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateSimpleEntryUseCaseImpl,
    dependencies: [CreateSimpleEntryRepository, AccessControl, CreateSimpleEntryDataFactory]
});
