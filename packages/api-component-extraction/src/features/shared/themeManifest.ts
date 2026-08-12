import { createAbstraction, createImplementation, Result } from "@webiny/feature/api";
import { GetThemeByIdRepository } from "@webiny/api-theme/features/GetThemeById/index.js";
import { toRevisionId } from "@webiny/api-theme/constants.js";
import { generateManifestArtifact, type ThemeManifest } from "@webiny/theme-common";
import {
    ExtractionNotFoundError,
    ExtractionValidationError,
    type ExtractionError
} from "~/domain/errors.js";

/**
 * Resolves the job's pinned theme ({ entryId, version }) to its generation manifest — the bindable
 * semantic slot list Cluster fingerprints against and Plan binds props to. Shared because both Cluster
 * and Plan need it; the pin resolves the same way the theme preview route does, via `toRevisionId`.
 */
export interface IThemeManifestResolver {
    resolve(entryId: string, version: number): Promise<Result<ThemeManifest, ExtractionError>>;
}

export const ThemeManifestResolver = createAbstraction<IThemeManifestResolver>(
    "ComponentExtraction/ThemeManifestResolver"
);
export namespace ThemeManifestResolver {
    export type Interface = IThemeManifestResolver;
}

class ThemeManifestResolverImpl implements IThemeManifestResolver {
    constructor(private getThemeById: GetThemeByIdRepository.Interface) {}

    async resolve(
        entryId: string,
        version: number
    ): Promise<Result<ThemeManifest, ExtractionError>> {
        const theme = await this.getThemeById.execute(toRevisionId(entryId, version));
        if (theme.isFail()) {
            if (theme.error.code === "Theme/NotFound") {
                return Result.fail(new ExtractionNotFoundError(`theme ${entryId} v${version}`));
            }
            return Result.fail(new ExtractionValidationError(theme.error.message));
        }

        const resolved = theme.value.resolved;
        if (!resolved) {
            // A draft that was never published has no frozen snapshot — the manifest is a projection of
            // that snapshot, so there is nothing to bind against yet.
            return Result.fail(
                new ExtractionValidationError(
                    `theme ${entryId} v${version} has no resolved snapshot; publish it before extracting against it`
                )
            );
        }

        return Result.ok(
            generateManifestArtifact(resolved, {
                themeId: theme.value.entryId,
                version: theme.value.version
            })
        );
    }
}

export const ThemeManifestResolverService = createImplementation({
    abstraction: ThemeManifestResolver,
    implementation: ThemeManifestResolverImpl,
    dependencies: [GetThemeByIdRepository]
});
