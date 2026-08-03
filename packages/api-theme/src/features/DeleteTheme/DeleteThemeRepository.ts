import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { DeleteThemeRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemeModel } from "~/domain/theme/abstractions.js";
import { ThemeNotFoundError, ThemePersistenceError } from "~/domain/theme/errors.js";

class DeleteThemeRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private themeModel: ThemeModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const result = await this.deleteEntry.execute(this.themeModel, params.id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ThemeNotFoundError(params.id));
            }
            return Result.fail(new ThemePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const DeleteThemeRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteThemeRepositoryImpl,
    dependencies: [DeleteEntryUseCase, ThemeModel]
});
