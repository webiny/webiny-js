import type { IAiPowerUpsSettings } from "~/api/types.js";

/**
 * A connection is one credential for one vendor. It carries no model.
 *
 * The section it replaces (`providers`) bundled a key with a single model, so a project that wanted
 * two Anthropic models had to paste the same key twice and keep both copies in sync. Splitting the
 * two means the key is entered once and every model that vendor offers is then selectable.
 */
export interface AiConnectionPreset {
    id: string;
    name: string;
    /** AI SDK namespace, e.g. "anthropic" or "openai". Matches `AiSdkFactory.id`. */
    sdkName: string;
    /** Plaintext. Only ever set on the way in from the admin form, never persisted. */
    apiKey?: string;
    apiKeyMasked: string;
    apiKeyEncrypted: string;
}

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        connections: {
            presets: AiConnectionPreset[];
        };
    }
}

export type ConnectionsSettings = IAiPowerUpsSettings["connections"];

export interface PersistedAiConnectionPreset {
    id: string;
    name: string;
    sdkName: string;
    apiKeyEncrypted: string;
    apiKeyMasked: string;
}

export interface PersistedConnections {
    presets: PersistedAiConnectionPreset[];
}

/** Shape of a preset in the legacy `providers` section, read once for migration. */
export interface LegacyProviderPreset {
    id: string;
    name: string;
    model?: string;
    apiKeyEncrypted?: string;
    apiKeyMasked?: string;
}

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

/** `"anthropic/claude-sonnet-4-5"` -> `"anthropic"`. */
export const sdkNameFromModel = (model: string | undefined): string =>
    (model ?? "").split("/")[0] ?? "";
