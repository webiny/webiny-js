import { Result } from "@webiny/feature/api";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetSimpleEntryUseCase } from "~/features/simpleContentEntries/getSimpleEntry/index.js";
import { SimpleEntryNotAuthorizedError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type { CmsModel } from "~/types/index.js";
import {
    DeleteSimpleEntryRepository,
    DeleteSimpleEntryUseCase as UseCaseAbstraction
} from "./abstractions/index.js";

class DeleteSimpleEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly repository: DeleteSimpleEntryRepository.Interface,
        private readonly accessControl: AccessControl.Interface,
        private readonly getSimpleEntry: GetSimpleEntryUseCase.Interface
    ) {}

    public async execute(
        model: CmsModel,
        id: string
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "d" });
        if (!canAccess) {
            return Result.fail(SimpleEntryNotAuthorizedError.fromModel(model));
        }

        const existing = await this.getSimpleEntry.execute(model, { where: { id } });
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }

        return this.repository.execute(model, existing.value);
    }
}

export const DeleteSimpleEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteSimpleEntryUseCaseImpl,
    dependencies: [DeleteSimpleEntryRepository, AccessControl, GetSimpleEntryUseCase]
});
