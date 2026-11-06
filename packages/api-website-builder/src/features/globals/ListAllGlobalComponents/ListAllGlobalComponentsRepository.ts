import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ListAllGlobalComponentsRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    type CmsEntryWbGlobalComponent,
    GlobalComponentModelProvider
} from "~/domain/globals/abstractions.js";
import { GlobalComponentPersistenceError } from "~/domain/globals/errors.js";
import { EntryToGlobalComponentMapper } from "~/domain/globals/EntryToGlobalComponentMapper.js";
import { GlobalComponentEntryId } from "~/domain/globals/GlobalComponentEntryId.js";
import { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";
import { listAllEntries } from "~/utils/listAllEntries.js";

class ListAllGlobalComponentsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: GlobalComponentModelProvider.Interface,
        private listEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute({ scope }: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const result = await listAllEntries(
            params => this.listEntries.execute<CmsEntryWbGlobalComponent>(model, params),
            { where: { values: scope ? { scope } : {} } }
        );

        if (result.isFail()) {
            return Result.fail(new GlobalComponentPersistenceError(result.error));
        }

        // As `ListGlobalComponentsRepository`: only records at the fixed entry id of their name, language and
        // scope count; strays and records of another scope (or with one, when listing without) are left out.
        const globalComponents = result.value
            .filter(entry => {
                const name = entry.values.name;
                const language = GlobalComponentLanguage.fromStored(entry.values.language);
                return (
                    typeof name === "string" &&
                    !!language &&
                    (entry.values.scope || undefined) === (scope || undefined) &&
                    GlobalComponentEntryId.from(name, language, scope).matches(entry.entryId)
                );
            })
            .map(entry => EntryToGlobalComponentMapper.toGlobalComponent(entry));

        return Result.ok(globalComponents);
    }
}

export const ListAllGlobalComponentsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListAllGlobalComponentsRepositoryImpl,
    dependencies: [GlobalComponentModelProvider, ListLatestEntriesUseCase]
});
