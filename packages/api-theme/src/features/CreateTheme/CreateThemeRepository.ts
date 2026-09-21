import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { CreateThemeRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemeModelProvider } from "~/domain/theme/abstractions.js";
import { EntryToThemeMapper } from "~/domain/theme/EntryToThemeMapper.js";
import { ThemePersistenceError, ThemeValidationError } from "~/domain/theme/errors.js";

class CreateThemeRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private themeModelProvider: ThemeModelProvider.Interface
    ) {}

    async execute(data: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const themeModel = await this.themeModelProvider.get();
        const result = await this.createEntry.execute(themeModel, { values: data });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new ThemeValidationError(result.error.message));
            }
            return Result.fail(new ThemePersistenceError(result.error));
        }

        return Result.ok(EntryToThemeMapper.toTheme(result.value));
    }
}

export const CreateThemeRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateThemeRepositoryImpl,
    dependencies: [CreateEntryUseCase, ThemeModelProvider]
});
