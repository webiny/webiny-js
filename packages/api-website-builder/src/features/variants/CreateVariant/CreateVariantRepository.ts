import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { CreateVariantRepository as RepositoryAbstraction } from "./abstractions/CreateVariantRepository.js";
import { VariantModel } from "~/domain/variant/abstractions.js";
import type { CmsEntryWbVariantValues } from "~/domain/variant/abstractions.js";
import { EntryToVariantMapper } from "~/domain/variant/EntryToVariantMapper.js";
import { VariantPersistenceError, VariantValidationError } from "~/domain/variant/errors.js";

class CreateVariantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private variantModel: VariantModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const values: CmsEntryWbVariantValues = {
            experimentId: params.experimentId,
            name: params.name,
            status: "draft",
            properties: params.content.properties,
            metadata: params.content.metadata,
            bindings: params.content.bindings,
            elements: params.content.elements,
            extensions: params.content.extensions ?? {}
        };

        const result = await this.createEntry.execute<CmsEntryWbVariantValues>(this.variantModel, {
            values
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new VariantValidationError(result.error.message));
            }
            return Result.fail(new VariantPersistenceError(result.error));
        }

        return Result.ok(EntryToVariantMapper.toVariant(result.value));
    }
}

export const CreateVariantRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateVariantRepositoryImpl,
    dependencies: [CreateEntryUseCase, VariantModel]
});
