import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { GetThemeByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemeModel } from "~/domain/theme/abstractions.js";
import { EntryToThemeMapper } from "~/domain/theme/EntryToThemeMapper.js";
import { ThemeNotFoundError, ThemePersistenceError } from "~/domain/theme/errors.js";

class GetThemeByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private themeModel: ThemeModel.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const result = await this.getEntryById.execute(this.themeModel, id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ThemeNotFoundError(id));
            }
            return Result.fail(new ThemePersistenceError(result.error));
        }

        return Result.ok(EntryToThemeMapper.toTheme(result.value));
    }
}

export const GetThemeByIdRepository = RepositoryAbstraction.createImplementation({
    implementation: GetThemeByIdRepositoryImpl,
    dependencies: [ThemeModel, GetEntryByIdUseCase]
});
