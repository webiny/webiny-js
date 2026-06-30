import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { GetVariantByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { VariantModel } from "~/domain/variant/abstractions.js";
import type { CmsEntryWbVariantValues } from "~/domain/variant/abstractions.js";
import { EntryToVariantMapper } from "~/domain/variant/EntryToVariantMapper.js";
import { VariantNotFoundError, VariantPersistenceError } from "~/domain/variant/errors.js";

class GetVariantByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private variantModel: VariantModel.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const result = await this.getEntryById.execute<CmsEntryWbVariantValues>(
            this.variantModel,
            id
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new VariantNotFoundError(id));
            }
            return Result.fail(new VariantPersistenceError(result.error));
        }

        return Result.ok(EntryToVariantMapper.toVariant(result.value));
    }
}

export const GetVariantByIdRepository = RepositoryAbstraction.createImplementation({
    implementation: GetVariantByIdRepositoryImpl,
    dependencies: [VariantModel, GetEntryByIdUseCase]
});
