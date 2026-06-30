import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { ListVariantsRepository as RepositoryAbstraction } from "./abstractions.js";
import { VariantModel } from "~/domain/variant/abstractions.js";
import type { CmsEntryWbVariantValues } from "~/domain/variant/abstractions.js";
import { EntryToVariantMapper } from "~/domain/variant/EntryToVariantMapper.js";
import { VariantPersistenceError } from "~/domain/variant/errors.js";

class ListVariantsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private variantModel: VariantModel.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const result = await this.listLatestEntries.execute<CmsEntryWbVariantValues>(
            this.variantModel,
            {
                where: {
                    values: {
                        experimentId: params.experimentId
                    }
                },
                sort: ["createdOn_ASC"],
                limit: 1000
            }
        );

        if (result.isFail()) {
            return Result.fail(new VariantPersistenceError(result.error));
        }

        const variants = result.value.entries.map(entry => EntryToVariantMapper.toVariant(entry));
        return Result.ok(variants);
    }
}

export const ListVariantsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListVariantsRepositoryImpl,
    dependencies: [VariantModel, ListLatestEntriesUseCase]
});
