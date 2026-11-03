import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ListGlobalComponentsRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    type CmsEntryWbGlobalComponent,
    GlobalComponentModelProvider
} from "~/domain/globals/abstractions.js";
import { GlobalComponentPersistenceError } from "~/domain/globals/errors.js";
import { EntryToGlobalComponentMapper } from "~/domain/globals/EntryToGlobalComponentMapper.js";
import { GlobalComponentEntryId } from "~/domain/globals/GlobalComponentEntryId.js";
import { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";
import { listAllEntries } from "~/utils/listAllEntries.js";

class ListGlobalComponentsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: GlobalComponentModelProvider.Interface,
        private listEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute({ language }: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        // Only the records of the language are read: each holds a full element document.
        const result = await listAllEntries(
            params => this.listEntries.execute<CmsEntryWbGlobalComponent>(model, params),
            { where: { values: { language } } }
        );

        if (result.isFail()) {
            return Result.fail(new GlobalComponentPersistenceError(result.error));
        }

        // A record lives at the fixed entry id of its name and language, where saves and single reads go;
        // any other entry is a stray. An entry without a name or a language has no fixed id, so it is a stray too.
        const globalComponents = result.value
            .filter(entry => {
                const name = entry.values.name;
                const entryLanguage = GlobalComponentLanguage.fromStored(entry.values.language);
                return (
                    typeof name === "string" &&
                    !!entryLanguage?.equals(language) &&
                    GlobalComponentEntryId.from(name, entryLanguage).matches(entry.entryId)
                );
            })
            .map(entry => EntryToGlobalComponentMapper.toGlobalComponent(entry));

        return Result.ok(globalComponents);
    }
}

export const ListGlobalComponentsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListGlobalComponentsRepositoryImpl,
    dependencies: [GlobalComponentModelProvider, ListLatestEntriesUseCase]
});
