import { Result } from "@webiny/feature/api";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetSimpleEntryUseCase } from "~/features/simpleContentEntries/getSimpleEntry/index.js";
import { UpdateSimpleEntryDataFactory } from "~/features/simpleContentEntries/entryDataFactories/updateSimpleEntryData/index.js";
import {
    SimpleEntryNotAuthorizedError,
    SimpleEntryValidationError
} from "~/features/simpleContentEntries/domain/errors/index.js";
import type {
    ISimpleCmsEntry,
    IUpdateSimpleEntryInput
} from "~/features/simpleContentEntries/types.js";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import {
    UpdateSimpleEntryRepository,
    UpdateSimpleEntryUseCase as UseCaseAbstraction
} from "./abstractions/index.js";

class UpdateSimpleEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: UpdateSimpleEntryRepository.Interface,
        private readonly accessControl: AccessControl.Interface,
        private readonly getSimpleEntry: GetSimpleEntryUseCase.Interface,
        private readonly dataFactory: UpdateSimpleEntryDataFactory.Interface
    ) {}

    public async execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: IUpdateSimpleEntryInput<TValues>
    ): Promise<Result<ISimpleCmsEntry<TValues>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(SimpleEntryNotAuthorizedError.fromModel(model));
        }

        const original = await this.getSimpleEntry.execute<TValues>(model, { where: { id } });
        if (original.isFail()) {
            return Result.fail(original.error);
        }

        try {
            const { entry } = await this.dataFactory.update<TValues>(model, original.value, input);

            const result = await this.repository.execute<TValues>(model, entry);
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

export const UpdateSimpleEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSimpleEntryUseCaseImpl,
    dependencies: [
        UpdateSimpleEntryRepository,
        AccessControl,
        GetSimpleEntryUseCase,
        UpdateSimpleEntryDataFactory
    ]
});
