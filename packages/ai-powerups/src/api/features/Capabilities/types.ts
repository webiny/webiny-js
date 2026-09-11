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
    /**
     * Appended to the capability's prompt.
     *
     * The only prompt customisation there is, and deliberately so. Replacing a prompt outright
     * used to be offered here and is not any more: for most capabilities the prompt *is* the output
     * contract the surrounding code parses, so replacing it means replacing part of the
     * implementation. Revision comparison regex-matches the HTML table its prompt specifies, and
     * page translation `JSON.parse`s a shape its prompt dictates, both failing silently if the
     * format goes away. Appending leaves the contract in place.
     *
     * A project that genuinely needs different behaviour decorates the use case in code, which is
     * how the AI translation itself is built.
     */
    additionalInstructions?: string;
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
