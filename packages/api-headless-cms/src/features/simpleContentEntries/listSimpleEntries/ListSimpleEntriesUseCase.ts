import { Result } from "@webiny/feature/api";
import { AccessControl } from "~/features/shared/abstractions.js";
import { SimpleEntryNotAuthorizedError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type {
    IListSimpleEntriesParams,
    IListSimpleEntriesResult
} from "~/features/simpleContentEntries/types.js";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import {
    ListSimpleEntriesRepository,
    ListSimpleEntriesUseCase as UseCaseAbstraction
} from "./abstractions/index.js";

class ListSimpleEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: ListSimpleEntriesRepository.Interface,
        private readonly accessControl: AccessControl.Interface
    ) {}

    public async execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params?: IListSimpleEntriesParams
    ): Promise<Result<IListSimpleEntriesResult<TValues>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "r" });
        if (!canAccess) {
            return Result.fail(SimpleEntryNotAuthorizedError.fromModel(model));
        }

        return this.repository.execute<TValues>(model, params ?? {});
    }
}

export const ListSimpleEntriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListSimpleEntriesUseCaseImpl,
    dependencies: [ListSimpleEntriesRepository, AccessControl]
});
