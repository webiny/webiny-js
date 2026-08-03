import { Result } from "@webiny/feature/api";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { CreateThemeRevisionFromRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemeModel } from "~/domain/theme/abstractions.js";
import { EntryToThemeMapper } from "~/domain/theme/EntryToThemeMapper.js";
import {
    ThemeNotFoundError,
    ThemePersistenceError,
    ThemeValidationError
} from "~/domain/theme/errors.js";

class CreateThemeRevisionFromRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createRevisionFrom: CreateEntryRevisionFromUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private themeModel: ThemeModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const existing = await this.getEntryById.execute(this.themeModel, params.id);

        if (existing.isFail()) {
            if (existing.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ThemeNotFoundError(params.id));
            }
            return Result.fail(new ThemePersistenceError(existing.error));
        }

        // The new draft starts as a copy, minus the frozen snapshot: it belongs to the version that
        // was published, not to the draft branched from it.
        const result = await this.createRevisionFrom.execute(this.themeModel, params.id, {
            values: { resolved: null }
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new ThemeValidationError(result.error.message));
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ThemeNotFoundError(params.id));
            }
            return Result.fail(new ThemePersistenceError(result.error));
        }

        return Result.ok(EntryToThemeMapper.toTheme(result.value));
    }
}

export const CreateThemeRevisionFromRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateThemeRevisionFromRepositoryImpl,
    dependencies: [CreateEntryRevisionFromUseCase, GetEntryByIdUseCase, ThemeModel]
});
