import { Result } from "@webiny/feature/api";
import { GetRevisionsByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionsByEntryId/index.js";
import { GetThemeRevisionsRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemeModel } from "~/domain/theme/abstractions.js";
import { EntryToThemeMapper } from "~/domain/theme/EntryToThemeMapper.js";
import { ThemePersistenceError } from "~/domain/theme/errors.js";

class GetThemeRevisionsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private themeModel: ThemeModel.Interface,
        private getRevisions: GetRevisionsByEntryIdUseCase.Interface
    ) {}

    async execute(entryId: string): RepositoryAbstraction.Return {
        const result = await this.getRevisions.execute(this.themeModel, entryId);

        if (result.isFail()) {
            return Result.fail(new ThemePersistenceError(result.error));
        }

        const revisions = result.value
            .map(entry => EntryToThemeMapper.toRevision(entry))
            .sort((a, b) => b.version - a.version);

        return Result.ok(revisions);
    }
}

export const GetThemeRevisionsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetThemeRevisionsRepositoryImpl,
    dependencies: [ThemeModel, GetRevisionsByEntryIdUseCase]
});
