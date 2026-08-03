import { BaseError } from "@webiny/feature/api";
import type { PublishBlocker } from "@webiny/theme-common";

export class ThemeNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "Theme/NotFound" as const;

    constructor(id: string) {
        super({ message: `Theme "${id}" was not found.`, data: { id } });
    }
}

export class ThemePersistenceError extends BaseError {
    override readonly code = "Theme/PersistenceError" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}

export class ThemeValidationError extends BaseError {
    override readonly code = "Theme/ValidationError" as const;

    constructor(message: string) {
        super({ message });
    }
}

export class ThemeNotAuthorizedError extends BaseError {
    override readonly code = "Theme/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized!" });
    }
}

/**
 * Publishing was refused. Carries the full blocker list so the UI can render it as a checklist
 * linking to each offending token, rather than a single opaque message.
 */
export class ThemeNotPublishableError extends BaseError<{ blockers: PublishBlocker[] }> {
    override readonly code = "Theme/NotPublishable" as const;

    constructor(blockers: PublishBlocker[]) {
        super({
            message:
                blockers.length === 1
                    ? `This theme cannot be published yet: ${blockers[0].message}`
                    : `This theme cannot be published yet — ${blockers.length} issues need fixing first.`,
            data: { blockers }
        });
    }
}

/**
 * Activation was refused because the version has never been published and therefore carries no
 * resolved snapshot. Activating it would point the live site at unresolved aliases.
 *
 * Note that this is NOT the same as "the CMS currently marks it published". Publishing a newer
 * revision flips older ones to `unpublished`, and those older revisions remain perfectly valid
 * rollback targets — their frozen snapshot is immutable. See `ActivateThemeUseCase`.
 */
export class ThemeNeverPublishedError extends BaseError<{ id: string; status: string }> {
    override readonly code = "Theme/NeverPublished" as const;

    constructor(id: string, status: string) {
        super({
            message:
                `Theme version "${id}" has never been published, so there is nothing to activate. ` +
                `Publish it first.`,
            data: { id, status }
        });
    }
}

/**
 * Refused because the theme is currently active. Deleting it would leave the live site pointing at
 * a version that no longer exists — deactivate or activate another theme first.
 */
export class ThemeIsActiveError extends BaseError<{ entryId: string }> {
    override readonly code = "Theme/IsActive" as const;

    constructor(entryId: string) {
        super({
            message:
                "This theme is currently active. Activate a different theme, or deactivate this " +
                "one, before deleting it.",
            data: { entryId }
        });
    }
}

/** No theme is active. A first-class, permanently supported state — see the design brief, section 9. */
export class NoActiveThemeError extends BaseError {
    override readonly code = "Theme/NoActiveTheme" as const;

    constructor() {
        super({ message: "No theme is active for this tenant." });
    }
}
