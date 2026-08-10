import type { Theme } from "~/domain/theme/abstractions.js";

/**
 * Webhook payloads carry a summary, not the theme document.
 *
 * A theme's token tree plus its resolved snapshot runs to tens of kilobytes, and a receiver only
 * needs to know which theme and version changed — it can fetch the artifacts from the delivery
 * endpoint if it wants the values.
 *
 * This is a type alias rather than an interface on purpose: the dispatcher takes an index-signature
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
