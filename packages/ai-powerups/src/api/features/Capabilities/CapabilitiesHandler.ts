import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { AI_MODEL_ROLE_IDS } from "~/api/features/ModelRoles/index.js";
import type { AiCapabilityEntry } from "./types.js";
import type { AiCapabilityOverride } from "./types.js";
import type { CapabilitiesSettings } from "./types.js";
import type { PersistedCapabilities } from "./types.js";

/*
 * Every field here is empty by default and the admin form sends `null` for an untouched one, so
 * each has to accept it. `mapToStorage` drops the nulls rather than persisting them.
 */
const overrideSchema = z.object({
    roleId: z.union([z.enum(AI_MODEL_ROLE_IDS), z.literal("")]).nullish(),
    connectionId: z.string().nullish(),
    model: z.string().nullish(),
    additionalInstructions: z.string().nullish()
});

/*
 * `enabled` is `nullish` for the same reason the strings are: an untouched switch can arrive as
 * `null`. `mapToStorage` settles it to a real boolean before storing.
 */
const entrySchema = z.object({
    enabled: z.boolean().nullish(),
    overrides: overrideSchema.nullish()
});

const inputSchema = z.object({
    items: z.record(z.string(), entrySchema)
});

/**
 * Keeps values that mean "not set" out of a stored override. The form sends `null` for an untouched
 * field, and persisting those would fill the blob with keys nobody chose. Applies to the overrides
 * only: `enabled` is always written, because "on" is a state worth reading back.
 */
const dropEmptyValues = (override: AiCapabilityOverride): AiCapabilityOverride =>
    Object.fromEntries(
        Object.entries(override).filter(([, value]) => {
            if (value === null || value === undefined) {
                return false;
            }
            // Whitespace counts as empty. A textarea someone tabbed through holds "  ", which would
            // otherwise be stored and then appended to the prompt as blank noise.
            return typeof value === "string" ? value.trim() !== "" : true;
        })
    ) as AiCapabilityOverride;

/**
 * The form sends `null` for a switch nobody touched, and that reads as enabled, same as absence.
 * Only an explicit `false` turns a capability off.
 */
const normaliseEnabled = (enabled: boolean | null | undefined): boolean => enabled !== false;

class CapabilitiesHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "capabilities";
    readonly inputSchema = inputSchema;

    mapFromStorage(persisted: unknown): CapabilitiesSettings {
        const stored = (persisted ?? {}) as PersistedCapabilities;
        return { items: stored.items ?? {} };
    }

    async mapToStorage(internal: unknown): Promise<PersistedCapabilities> {
        const input = internal as CapabilitiesSettings;

        /*
         * Every capability the form sent gets a key, `enabled` included, so the stored blob says
         * plainly what the screen said. Entries are not dropped for being "empty": a row that only
         * carries `enabled: true` is the normal state and worth seeing.
         *
         * Reading still has to treat a *missing* entry as enabled, because a capability registered
         * after the last save has no key at all. `isCapabilityEnabled` is where that lives.
         */
        const entries = Object.entries(input.items ?? {})
            // A type guard, not a plain predicate: a bare `Boolean(...)` filter reads the same but
            // narrows nothing, so the `undefined` this exists to drop would flow straight on.
            .filter((entry): entry is [string, AiCapabilityEntry] => Boolean(entry[1]))
            .map(
                ([id, entry]) =>
                    [
                        id,
                        {
                            enabled: normaliseEnabled(entry.enabled),
                            overrides: dropEmptyValues(entry.overrides ?? {})
                        }
                    ] as const
            );

        return { items: Object.fromEntries(entries) };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: CapabilitiesHandlerImpl,
    dependencies: []
});
