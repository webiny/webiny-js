import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { DeleteVariantRepository as RepositoryAbstraction } from "./abstractions.js";
import { VariantModel } from "~/domain/variant/abstractions.js";
import { VariantNotFoundError, VariantPersistenceError } from "~/domain/variant/errors.js";

class DeleteVariantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private variantModel: VariantModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const result = await this.deleteEntry.execute(this.variantModel, params.id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new VariantNotFoundError(params.id));
            }
            return Result.fail(new VariantPersistenceError(result.error));
        }

        return Result.ok(true);
    }
}

export const DeleteVariantRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteVariantRepositoryImpl,
    dependencies: [DeleteEntryUseCase, VariantModel]
});
