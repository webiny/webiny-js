import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import { GetLanguageByCodeRepository as RepositoryAbstraction } from "./abstractions.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { LanguageNotFoundError, LanguagePersistenceError } from "~/api/domain/errors.js";
import type { Language } from "~/api/domain/Language.js";

class GetLanguageByCodeRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(code: string): RepositoryAbstraction.Return {
        const modelResult = await this.getModel.execute(LANGUAGE_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new LanguagePersistenceError(modelResult.error));
        }

        const model = modelResult.value;

        const listResult = await this.listLatestEntries.execute(model, {
            where: {
                values: {
                    code
                }
            },
            limit: 1
        });

        if (listResult.isFail()) {
            return Result.fail(new LanguagePersistenceError(listResult.error));
        }

        const { entries } = listResult.value;

        if (entries.length === 0) {
            return Result.fail(new LanguageNotFoundError(code));
        }

        const entry = entries[0];

        const language: Language = {
            id: entry.entryId,
            name: entry.values.name,
            code: entry.values.code,
            direction: entry.values.direction,
            isDefault: entry.values.isDefault,
            enabled: entry.values.enabled
        };

        return Result.ok(language);
    }
}

export const GetLanguageByCodeRepository = RepositoryAbstraction.createImplementation({
    implementation: GetLanguageByCodeRepositoryImpl,
    dependencies: [GetModelUseCase, ListLatestEntriesUseCase]
});
