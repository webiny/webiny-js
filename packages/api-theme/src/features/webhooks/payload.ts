import type { ActiveThemePointer, Theme } from "~/domain/theme/abstractions.js";

/**
 * Webhook payloads carry a summary, not the theme document.
 *
 * A theme's token tree plus its resolved snapshot runs to tens of kilobytes, and a receiver wiring
 * up revalidation only needs to know which theme and version changed — it can fetch the artifacts
 * from the delivery endpoint if it wants the values.
 *
 * These are type aliases rather than interfaces on purpose: the dispatcher takes an index-signature
 * type, and TypeScript only infers an implicit index signature for aliases.
 */
export type ThemeWebhookPayload = {
    themeId: string;
    version: number;
    name: string;
    status: string;
};

export const toThemePayload = (theme: Theme): ThemeWebhookPayload => ({
    themeId: theme.entryId,
    version: theme.version,
    name: theme.properties?.name ?? "",
    status: theme.status
});

export type ThemeActivationWebhookPayload = {
    themeId: string;
    version: number;
    name: string;
    status: string;
    /** Immutable artifact paths for the version that just went live. */
    artifacts: { css: string; json: string };
    previous: { themeId: string; version: number } | null;
};

export const toActivationPayload = (
    theme: Theme,
    previous: ActiveThemePointer | null
): ThemeActivationWebhookPayload => ({
    ...toThemePayload(theme),
    artifacts: {
        css: `/_webiny/theme/${theme.entryId}/${theme.version}/tokens.css`,
        json: `/_webiny/theme/${theme.entryId}/${theme.version}/tokens.json`
    },
    previous: previous ? { themeId: previous.entryId, version: previous.version } : null
});
