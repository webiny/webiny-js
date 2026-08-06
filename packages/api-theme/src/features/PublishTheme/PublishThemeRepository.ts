import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry";
import { PublishThemeRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemeModel } from "~/domain/theme/abstractions.js";
import { EntryToThemeMapper } from "~/domain/theme/EntryToThemeMapper.js";
import {
    ThemeNotFoundError,
    ThemePersistenceError,
    ThemeValidationError
} from "~/domain/theme/errors.js";

class PublishThemeRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private publishEntry: PublishEntryUseCase.Interface,
        private themeModel: ThemeModel.Interface
    ) {}

    async execute({
        id,
        resolved,
        comment
    }: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const existing = await this.getEntryById.execute(this.themeModel, id);

        if (existing.isFail()) {
            if (existing.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ThemeNotFoundError(id));
            }
            return Result.fail(new ThemePersistenceError(existing.error));
        }

        // Write the snapshot and the publish note BEFORE publishing: publishing locks the revision,
        // so the frozen values have to be on it by then. The comment is always overwritten (with the
        // empty string when omitted) so a value carried over from a branched draft never lingers.
        const stored = await this.updateEntry.execute(this.themeModel, id, {
            values: { ...existing.value.values, resolved, publishComment: comment ?? "" }
        });

        if (stored.isFail()) {
            if (stored.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new ThemeValidationError(stored.error.message));
            }
            return Result.fail(new ThemePersistenceError(stored.error));
        }

        const published = await this.publishEntry.execute(this.themeModel, id);

        if (published.isFail()) {
            if (published.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ThemeNotFoundError(id));
            }
            return Result.fail(new ThemePersistenceError(published.error));
        }

        return Result.ok(EntryToThemeMapper.toTheme(published.value));
    }
}

export const PublishThemeRepository = RepositoryAbstraction.createImplementation({
    implementation: PublishThemeRepositoryImpl,
    dependencies: [GetEntryByIdUseCase, UpdateEntryUseCase, PublishEntryUseCase, ThemeModel]
});
