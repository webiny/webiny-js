import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import { ListLanguagesRepository as RepositoryAbstraction } from "./abstractions.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { LanguagePersistenceError } from "~/api/domain/errors.js";
import type { Language } from "~/api/domain/Language.js";

class ListLanguagesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(): RepositoryAbstraction.Return {
        const modelResult = await this.getModel.execute(LANGUAGE_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new LanguagePersistenceError(modelResult.error));
        }

        const model = modelResult.value;

        const listResult = await this.listLatestEntries.execute(model, {
            limit: 1000
        });

        if (listResult.isFail()) {
            return Result.fail(new LanguagePersistenceError(listResult.error));
        }

        const languages: Language[] = listResult.value.entries.map(entry => ({
            id: entry.id,
            entryId: entry.entryId,
            name: entry.values.name,
            code: entry.values.code,
            direction: entry.values.direction,
            isDefault: entry.values.isDefault,
            enabled: entry.values.enabled
        }));

        return Result.ok(languages);
    }
}

export const ListLanguagesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListLanguagesRepositoryImpl,
    dependencies: [GetModelUseCase, ListLatestEntriesUseCase]
});
