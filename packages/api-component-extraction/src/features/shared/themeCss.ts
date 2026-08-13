import { createAbstraction, createImplementation, Result } from "@webiny/feature/api";
import { GetThemeByIdRepository } from "@webiny/api-theme/features/GetThemeById/index.js";
import { toRevisionId } from "@webiny/api-theme/constants.js";
import { generateCssArtifact } from "@webiny/theme-common";
import {
    ExtractionNotFoundError,
    ExtractionValidationError,
    type ExtractionError
} from "~/domain/errors.js";

/**
 * Resolves the job's pinned theme ({ entryId, version }) to its `--wby-*` token CSS — the same
 * `tokens.css` artifact the theme delivery route serves and the component editor injects into its
 * preview. The rendered-component screenshot pushes this into the sandbox so a generated component's
 * `var(--wby-*)` values resolve to the theme it was generated against, not the site's active theme.
 *
 * Mirrors {@link ThemeManifestResolver}: same pin resolution (`toRevisionId`), same "must be published"
 * rule — the CSS is a projection of the frozen snapshot, so a never-published draft has nothing to emit.
 */
export interface IThemeCssResolver {
    resolve(entryId: string, version: number): Promise<Result<string, ExtractionError>>;
}

export const ThemeCssResolver = createAbstraction<IThemeCssResolver>(
    "ComponentExtraction/ThemeCssResolver"
);
export namespace ThemeCssResolver {
    export type Interface = IThemeCssResolver;
}

class ThemeCssResolverImpl implements IThemeCssResolver {
    constructor(private getThemeById: GetThemeByIdRepository.Interface) {}

    async resolve(entryId: string, version: number): Promise<Result<string, ExtractionError>> {
        const theme = await this.getThemeById.execute(toRevisionId(entryId, version));
        if (theme.isFail()) {
            if (theme.error.code === "Theme/NotFound") {
                return Result.fail(new ExtractionNotFoundError(`theme ${entryId} v${version}`));
            }
            return Result.fail(new ExtractionValidationError(theme.error.message));
        }

        const resolved = theme.value.resolved;
        if (!resolved) {
            return Result.fail(
                new ExtractionValidationError(
                    `theme ${entryId} v${version} has no resolved snapshot; publish it before extracting against it`
                )
            );
        }

        return Result.ok(
            generateCssArtifact(resolved, {
                themeId: theme.value.entryId,
                version: theme.value.version
            })
        );
    }
}

export const ThemeCssResolverService = createImplementation({
    abstraction: ThemeCssResolver,
    implementation: ThemeCssResolverImpl,
    dependencies: [GetThemeByIdRepository]
});
