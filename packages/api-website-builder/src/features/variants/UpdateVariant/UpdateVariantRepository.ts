import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { UpdateVariantRepository as RepositoryAbstraction } from "./abstractions/UpdateVariantRepository.js";
import { VariantModelProvider } from "~/domain/variant/abstractions.js";
import type { CmsEntryWbVariantValues } from "~/domain/variant/abstractions.js";
import { EntryToVariantMapper } from "~/domain/variant/EntryToVariantMapper.js";
import {
    VariantNotFoundError,
    VariantPersistenceError,
    VariantValidationError
} from "~/domain/variant/errors.js";

class UpdateVariantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private variantModelProvider: VariantModelProvider.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const variantModel = await this.variantModelProvider.get();
        const getResult = await this.getEntryById.execute(variantModel, params.id);
        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new VariantNotFoundError(params.id));
            }
            return Result.fail(new VariantPersistenceError(getResult.error));
        }

        const result = await this.updateEntry.execute<CmsEntryWbVariantValues>(
            variantModel,
            params.id,
            { values: params.data as Partial<CmsEntryWbVariantValues> }
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new VariantValidationError(result.error.message));
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new VariantNotFoundError(params.id));
            }
            return Result.fail(new VariantPersistenceError(result.error));
        }

        return Result.ok(EntryToVariantMapper.toVariant(result.value));
    }
}

export const UpdateVariantRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateVariantRepositoryImpl,
    dependencies: [UpdateEntryUseCase, GetEntryByIdUseCase, VariantModelProvider]
});
