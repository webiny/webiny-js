import { Result } from "@webiny/feature/api";
import {
    createResolvedSnapshot,
    generateCssArtifact,
    generateJsonArtifact,
    validateForPublish,
    type ResolvedThemeSnapshot
} from "@webiny/theme-common";
import { ThemeArtifactService as ServiceAbstraction, type ArtifactFile } from "./abstractions.js";
import type { Theme } from "~/domain/theme/abstractions.js";
import { ThemeNotPublishableError } from "~/domain/theme/errors.js";

/**
 * Artifacts are generated from the snapshot on request rather than stored.
 *
 * Both artifacts are deterministic string projections of an immutable snapshot, so generating them
 * on read gives byte-identical output to generating them once at publish — without a second copy of
 * the data to keep in sync, and without pushing a large theme past DynamoDB's item limit. The
 * response carries a long immutable TTL, so in practice each version is generated once per edge
 * cache.
 */
class ThemeArtifactServiceImpl implements ServiceAbstraction.Interface {
    render(theme: Theme, file: ArtifactFile) {
        const snapshot = this.snapshotFor(theme);

        if (snapshot.isFail()) {
            return Result.fail(snapshot.error);
        }

        const body =
            file === "tokens.css"
                ? generateCssArtifact(snapshot.value, {
                      themeId: theme.entryId,
                      version: theme.version
                  })
                : JSON.stringify(
                      generateJsonArtifact(snapshot.value, {
                          themeId: theme.entryId,
                          version: theme.version
                      }),
                      null,
                      2
                  );

        return Result.ok({
            contentType:
                file === "tokens.css"
                    ? "text/css; charset=utf-8"
                    : "application/json; charset=utf-8",
            body,
            immutable: theme.resolved !== null
        });
    }

    private snapshotFor(theme: Theme): Result<ResolvedThemeSnapshot, ThemeNotPublishableError> {
        // A published version always uses its frozen snapshot. Later edits to a primitive cannot
        // change what it renders — that is the whole point of freezing at publish.
        if (theme.resolved) {
            return Result.ok(theme.resolved);
        }

        // A draft is resolved on demand. Validate first so an invalid draft returns the blocker list
        // rather than throwing out of the generator.
        const validation = validateForPublish(theme.tokens, theme.settings);
        if (validation.blockers.length > 0) {
            return Result.fail(new ThemeNotPublishableError(validation.blockers));
        }

        return Result.ok(
            createResolvedSnapshot({
                document: theme.tokens,
                policy: theme.policy,
                settings: theme.settings
            })
        );
    }
}

export const ThemeArtifactService = ServiceAbstraction.createImplementation({
    implementation: ThemeArtifactServiceImpl,
    dependencies: []
});
