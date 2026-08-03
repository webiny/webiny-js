import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { CreateThemeRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemeModel } from "~/domain/theme/abstractions.js";
import { EntryToThemeMapper } from "~/domain/theme/EntryToThemeMapper.js";
import { ThemePersistenceError, ThemeValidationError } from "~/domain/theme/errors.js";

class CreateThemeRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private themeModel: ThemeModel.Interface
    ) {}

    async execute(data: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const result = await this.createEntry.execute(this.themeModel, { values: data });

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
    dependencies: [CreateEntryUseCase, ThemeModel]
});
