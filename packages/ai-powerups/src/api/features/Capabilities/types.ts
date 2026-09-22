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
 * Everything a project decided about one capability.
 *
 * Two separate concerns, deliberately not flattened into one bag of optional fields. `enabled` is a
 * boolean and the rest are strings, and an emptiness check that has to judge both at once is how
 * "the user switched this off" ends up indistinguishable from "the user typed nothing".
 */
export interface AiCapabilityEntry {
    /**
     * Absent means enabled.
     *
     * A licence that grants a capability turns it on immediately; nobody opens settings to opt in.
     * A save writes this explicitly either way, so a stored blob says plainly what the screen said,
     * but absence still has to read as enabled: a capability registered since the last save has no
     * entry at all.
     *
     * Read it as `enabled !== false`, never as `!enabled`. The second is true for `undefined` too,
     * which silently disables every capability nobody has saved yet.
     */
    enabled?: boolean;
    overrides: AiCapabilityOverride;
}

/**
 * Keyed by capability id.
 *
 * Unlike model roles this cannot be a union of known keys: features register capabilities at
 * runtime and an extension can add its own, so there is no compile-time set to enumerate.
 *
 * `Partial` is doing real work though. A bare `Record<string, T>` claims every string key is
 * present, so a lookup types as `T` and the `?? {}` every caller writes looks redundant to the
 * compiler. Most capabilities are untouched, so a miss is the common case.
 */
export type AiCapabilityEntries = Partial<Record<string, AiCapabilityEntry>>;

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        capabilities: {
            items: AiCapabilityEntries;
        };
    }
}

export type CapabilitiesSettings = IAiPowerUpsSettings["capabilities"];

export interface PersistedCapabilities {
    items?: AiCapabilityEntries;
}

/** Absent means enabled. Spelled out once so no call site has to get the comparison right. */
export const isCapabilityEnabled = (entry: AiCapabilityEntry | undefined): boolean =>
    entry?.enabled !== false;
