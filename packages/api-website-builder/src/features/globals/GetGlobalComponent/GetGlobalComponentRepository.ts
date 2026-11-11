import { Result } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetGlobalComponentRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    type CmsEntryWbGlobalComponent,
    GlobalComponentModelProvider
} from "~/domain/globals/abstractions.js";
import {
    GlobalComponentNotFoundError,
    GlobalComponentPersistenceError
} from "~/domain/globals/errors.js";
import { EntryToGlobalComponentMapper } from "~/domain/globals/EntryToGlobalComponentMapper.js";
import { GlobalComponentEntryId } from "~/domain/globals/GlobalComponentEntryId.js";
import { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";

class GetGlobalComponentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: GlobalComponentModelProvider.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface
    ) {}

    async execute({
        name,
        language,
        scope
    }: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        // Read by the record's fixed entry id: a search-backed list can lag a save that just happened.
        const result = await this.getLatestRevision.execute<CmsEntryWbGlobalComponent>(model, {
            id: GlobalComponentEntryId.from(
                name,
                GlobalComponentLanguage.from(language),
                scope
            ).toString()
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new GlobalComponentNotFoundError(name, language));
            }
            return Result.fail(new GlobalComponentPersistenceError(result.error));
        }

        return Result.ok(EntryToGlobalComponentMapper.toGlobalComponent(result.value));
    }
}

export const GetGlobalComponentRepository = RepositoryAbstraction.createImplementation({
    implementation: GetGlobalComponentRepositoryImpl,
    dependencies: [GlobalComponentModelProvider, GetLatestRevisionByEntryIdUseCase]
});
