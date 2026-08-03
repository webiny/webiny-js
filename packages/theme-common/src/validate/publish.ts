import { findContrastFailures } from "~/a11y/contrast.js";
import { findZoomWarnings } from "~/a11y/zoom.js";
import { CANONICAL_SLOTS } from "~/canonical/index.js";
import { validateTokenDocument } from "~/dtcg/schema.js";
import { collectTokens, getTokenAtPath } from "~/dtcg/traverse.js";
import { META_EXTENSION, type TokenDocument, type TokenPath } from "~/dtcg/types.js";
import { validateFluidStep } from "~/fluid/clamp.js";
import { resolveDocumentModes } from "~/resolve/alias.js";
import type { ThemeSettings } from "~/theme/settings.js";

/**
 * The publish gate — see the design brief, sections 4.2, 4.5, 4.8 and 11.
 *
 * Blockers stop a publish. Warnings never do: contrast and zoom issues are advisory and can be
 * published past. The two lists are returned separately so the UI can make that distinction
 * obvious at a glance.
 */

export type PublishBlockerCode =
    | "Theme/InvalidDocument"
    | "Theme/MissingCanonicalSlot"
    | "Theme/UnresolvedReference"
    | "Theme/InvalidFluidStep";

export interface PublishBlocker {
    code: PublishBlockerCode;
    /** Token path the editor should link to, when the blocker is addressed to one. */
    path?: TokenPath;
    message: string;
}

export type PublishWarningCode = "A11y/Contrast" | "A11y/Zoom";

export interface PublishWarning {
    code: PublishWarningCode;
    path: TokenPath;
    message: string;
}

export interface PublishValidationResult {
    blockers: PublishBlocker[];
    warnings: PublishWarning[];
}

export const canPublish = (result: PublishValidationResult): boolean => {
    return result.blockers.length === 0;
};

/**
 * Validates a draft for publishing. Runs every check and returns everything it found — publish
 * validation is a list the user works through, not a first-failure abort.
 */
export const validateForPublish = (
    document: TokenDocument,
    settings: ThemeSettings
): PublishValidationResult => {
    const blockers: PublishBlocker[] = [];

    const structural = validateTokenDocument(document);
    if (!structural.valid) {
        return {
            blockers: structural.issues.map(issue => ({
                code: "Theme/InvalidDocument" as const,
                path: issue.path || undefined,
                message: issue.message
            })),
            // Nothing downstream can be trusted on a malformed document.
            warnings: []
        };
    }

    // A theme is never partially filled. Publishing is blocked if any canonical slot is missing.
    for (const slot of CANONICAL_SLOTS) {
        if (!getTokenAtPath(document, slot.path)) {
            blockers.push({
                code: "Theme/MissingCanonicalSlot",
                path: slot.path,
                message: `"${slot.path}" has no value. Every canonical slot must resolve before publishing.`
            });
        }
    }

    // Fluid metadata has to produce valid CSS before artifacts are generated.
    for (const visited of collectTokens(document).values()) {
        const fluid = visited.token.$extensions?.[META_EXTENSION]?.fluid;
        if (!fluid) {
            continue;
        }
        for (const error of validateFluidStep(fluid, settings.viewport)) {
            blockers.push({
                code: "Theme/InvalidFluidStep",
                path: visited.path,
                message: error.message
            });
        }
    }

    const modes = resolveDocumentModes(document);

    for (const mode of ["light", "dark"] as const) {
        for (const error of modes[mode].errors) {
            blockers.push({
                code: "Theme/UnresolvedReference",
                path: error.path,
                message: `${error.message} (${mode} mode)`
            });
        }
    }

    // A canonical slot that resolved to nothing is already reported as an unresolved reference or a
    // missing slot, so no extra blocker is added here.

    const warnings: PublishWarning[] = [
        ...findContrastFailures({ light: modes.light.tokens, dark: modes.dark.tokens }).map(
            failure => ({
                code: "A11y/Contrast" as const,
                path: failure.pair.foreground,
                message: `${failure.message} (${failure.mode} mode)`
            })
        ),
        ...findZoomWarnings(
            [...collectTokens(document).values()]
                .map(visited => ({
                    path: visited.path,
                    step: visited.token.$extensions?.[META_EXTENSION]?.fluid
                }))
                .filter(
                    (entry): entry is { path: TokenPath; step: NonNullable<typeof entry.step> } =>
                        entry.step !== undefined
                )
        ).map(warning => ({
            code: "A11y/Zoom" as const,
            path: warning.path,
            message: warning.message
        }))
    ];

    return { blockers, warnings };
};
