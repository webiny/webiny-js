import { Result } from "@webiny/feature/api";
import { AccessControl } from "~/features/shared/abstractions.js";
import { SimpleEntryNotAuthorizedError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type {
    IGetSimpleEntryParams,
    ISimpleCmsEntry
} from "~/features/simpleContentEntries/types.js";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import {
    GetSimpleEntryRepository,
    GetSimpleEntryUseCase as UseCaseAbstraction
} from "./abstractions/index.js";

class GetSimpleEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: GetSimpleEntryRepository.Interface,
        private readonly accessControl: AccessControl.Interface
    ) {}

    public async execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: IGetSimpleEntryParams
    ): Promise<Result<ISimpleCmsEntry<TValues>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "r" });
        if (!canAccess) {
            return Result.fail(SimpleEntryNotAuthorizedError.fromModel(model));
        }

        return this.repository.execute<TValues>(model, params);
    }
}

export const GetSimpleEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSimpleEntryUseCaseImpl,
    dependencies: [GetSimpleEntryRepository, AccessControl]
});
