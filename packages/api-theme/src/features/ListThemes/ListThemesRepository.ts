import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { CmsWhereMapper } from "@webiny/api-headless-cms/features/whereMapper/abstractions.js";
import { CmsSortMapper } from "@webiny/api-headless-cms/features/sortMapper/abstractions.js";
import { ListThemesRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemeModelProvider } from "~/domain/theme/abstractions.js";
import { EntryToThemeMapper } from "~/domain/theme/EntryToThemeMapper.js";
import { ThemePersistenceError } from "~/domain/theme/errors.js";

const DEFAULT_LIMIT = 50;

class ListThemesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private themeModelProvider: ThemeModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private whereMapper: CmsWhereMapper.Interface,
        private sortMapper: CmsSortMapper.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const themeModel = await this.themeModelProvider.get();
        const result = await this.listLatestEntries.execute(themeModel, {
            where: this.whereMapper.map({
                fields: themeModel.fields,
                input: params.where ?? {}
            }),
            sort: this.sortMapper.map({
                fields: themeModel.fields,
                input: params.sort ?? ["savedOn_DESC"]
            }),
            limit: params.limit ?? DEFAULT_LIMIT,
            after: params.after ?? null,
            search: params.search
        });

        if (result.isFail()) {
            return Result.fail(new ThemePersistenceError(result.error));
        }

        const { entries, meta } = result.value;

        return Result.ok({
            themes: entries.map(entry => EntryToThemeMapper.toTheme(entry)),
            meta
        });
    }
}

export const ListThemesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListThemesRepositoryImpl,
    dependencies: [ThemeModelProvider, ListLatestEntriesUseCase, CmsWhereMapper, CmsSortMapper]
});
