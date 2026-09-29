/**
 * Reading the settings section `connections` replaces.
 *
 * `providers` bundled a credential with a single model. Nothing writes it any more, but an upgraded
 * project still has one and has never saved since, so both `Connections` and `ModelRoles` derive
 * their first value from it. That makes this the one piece of code allowed to reach into a section
 * nobody owns.
 *
 * It lives in its own module, and not with the connection types, because it is the only part of
 * this feature with an expiry date: when the legacy section is finally dropped, this file and its
 * two callers go with it.
 */

/** Shape of a preset in the legacy `providers` section. */
export interface LegacyProviderPreset {
    id: string;
    name: string;
    model?: string;
    apiKeyEncrypted?: string;
    apiKeyMasked?: string;
}

/**
 * Deliberately defensive. This parses a blob written by an older version against no schema, so
 * every level is checked rather than asserted: a project that never had `providers` and one that
 * has a malformed one both read as "nothing to migrate" instead of throwing on read.
 */
export const readLegacyProviderPresets = (
    all: Record<string, unknown> | undefined
): LegacyProviderPreset[] => {
    const providers = all?.["providers"];
    if (!providers || typeof providers !== "object") {
        return [];
    }

    const presets = (providers as { presets?: unknown }).presets;
    return Array.isArray(presets) ? (presets as LegacyProviderPreset[]) : [];
};
