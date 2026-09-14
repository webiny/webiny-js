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

/**
 * Keyed by capability id.
 *
 * Unlike model roles this cannot be a union of known keys: features register capabilities at
 * runtime and an extension can add its own, so there is no compile-time set to enumerate.
 *
 * `Partial` is doing real work though. A bare `Record<string, T>` claims every string key is
 * present, so a lookup types as `T` and the `?? {}` every caller writes looks redundant to the
 * compiler. Most capabilities have no override at all, so a miss is the common case.
 */
export type AiCapabilityOverrides = Partial<Record<string, AiCapabilityOverride>>;

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        capabilities: {
            overrides: AiCapabilityOverrides;
        };
    }
}

export type CapabilitiesSettings = IAiPowerUpsSettings["capabilities"];

export interface PersistedCapabilities {
    overrides?: AiCapabilityOverrides;
}
