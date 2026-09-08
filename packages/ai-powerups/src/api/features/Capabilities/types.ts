import type { IAiPowerUpsSettings } from "~/api/types.js";
import type { AiModelRoleId } from "~/api/features/ModelRoles/index.js";

/**
 * What a project changed about one capability. Every field is optional and empty by default: an
 * untouched capability runs on its declared role with its declared prompt.
 */
export interface AiCapabilityOverride {
    /** Run this capability on a different role. Empty means use the capability's default. */
    roleId?: AiModelRoleId | "";
    /** Pin an exact connection, bypassing roles entirely. Requires `model` too. */
    connectionId?: string;
    /** Pin an exact model. Only read when `connectionId` is also set. */
    model?: string;
    /** Appended to the system prompt. The safe option, and the one the UI shows by default. */
    additionalInstructions?: string;
    /**
     * The explicit opt-in for owning this capability's prompt. Kept separate from `guidance` so
     * switching it off restores Webiny's prompt without the project having to clear the text they
     * wrote, and switching it back on returns them to it.
     */
    replacePrompt?: boolean;
    /**
     * Replaces the capability's own guidance, and only when `replacePrompt` is set. Offered only
     * for capabilities that declare `guidance`, because a project that sets this stops receiving
     * our prompt improvements for this capability.
     */
    guidance?: string;
}

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        capabilities: {
            /** Keyed by capability id. */
            overrides: Record<string, AiCapabilityOverride>;
        };
    }
}

export type CapabilitiesSettings = IAiPowerUpsSettings["capabilities"];

export interface PersistedCapabilities {
    overrides?: Record<string, AiCapabilityOverride>;
}
