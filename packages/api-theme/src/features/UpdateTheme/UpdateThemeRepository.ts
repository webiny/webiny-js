import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { UpdateThemeRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemeModel } from "~/domain/theme/abstractions.js";
import { EntryToThemeMapper } from "~/domain/theme/EntryToThemeMapper.js";
import {
    ThemeNotFoundError,
    ThemePersistenceError,
    ThemeValidationError
} from "~/domain/theme/errors.js";

class UpdateThemeRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private themeModel: ThemeModel.Interface
    ) {}

    async execute({ id, data }: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const existing = await this.getEntryById.execute(this.themeModel, id);

        if (existing.isFail()) {
            if (existing.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ThemeNotFoundError(id));
            }
            return Result.fail(new ThemePersistenceError(existing.error));
        }

        // Merge section by section: the editor saves one group at a time, and a partial save must
        // not blank the sections it did not touch.
        const current = existing.value.values;
        const values = {
            properties: data.properties
                ? { ...current.properties, ...data.properties }
                : current.properties,
            tokens: data.tokens ?? current.tokens,
            policy: data.policy ?? current.policy,
            settings: data.settings ?? current.settings,
            resolved: current.resolved ?? null,
            metadata: data.metadata ?? current.metadata,
            extensions: data.extensions ?? current.extensions
        };

        const result = await this.updateEntry.execute(this.themeModel, id, { values });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new ThemeValidationError(result.error.message));
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ThemeNotFoundError(id));
            }
            return Result.fail(new ThemePersistenceError(result.error));
        }

        return Result.ok(EntryToThemeMapper.toTheme(result.value));
    }
}

export const UpdateThemeRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateThemeRepositoryImpl,
    dependencies: [UpdateEntryUseCase, GetEntryByIdUseCase, ThemeModel]
});
