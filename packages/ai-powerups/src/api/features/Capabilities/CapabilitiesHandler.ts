import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { AI_MODEL_ROLE_IDS } from "~/api/features/ModelRoles/index.js";
import type {
    AiCapabilityEntry,
    AiCapabilityOverride,
    CapabilitiesSettings,
    PersistedCapabilities
} from "./types.js";

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
 * `enabled` is `nullish` for the same reason the strings are: an untouched switch arrives as `null`.
 * `mapToStorage` turns anything that is not an explicit `false` back into absence.
 */
const entrySchema = z.object({
    enabled: z.boolean().nullish(),
    overrides: overrideSchema.nullish()
});

const inputSchema = z.object({
    items: z.record(z.string(), entrySchema)
});

/** Keeps the persisted blob free of overrides that only hold empty strings. */
const isEmptyOverride = (override: AiCapabilityOverride): boolean =>
    !override.roleId &&
    !override.connectionId &&
    !override.model &&
    !override.additionalInstructions?.trim();

/**
 * Keeps values that mean "not set" out of storage. The form sends `null` for an untouched field, and
 * persisting those would mean every capability a project never configured still occupies a key.
 */
const dropEmptyValues = (override: AiCapabilityOverride): AiCapabilityOverride =>
    Object.fromEntries(
        Object.entries(override).filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
        )
    ) as AiCapabilityOverride;

/**
 * Whether an entry is worth a key in storage.
 *
 * Note `entry.enabled !== false` rather than `!entry.enabled`. The two look interchangeable and
 * differ on the one value this feature exists to record: `!entry.enabled` is also true for
 * `undefined`, so a disabled capability reads as empty, its row is dropped, and it comes back
 * enabled on the next load. The switch would appear to do nothing.
 */
const isEmptyEntry = (entry: AiCapabilityEntry): boolean =>
    entry.enabled !== false && isEmptyOverride(entry.overrides);

/**
 * `false` survives, anything else becomes absence.
 *
 * Storing `true` would be storing "the default, again": a licence that grants a capability enables
 * it with nothing written down, so the only decision worth a byte is switching one off.
 */
const normaliseEnabled = (enabled: boolean | null | undefined): boolean | undefined =>
    enabled === false ? false : undefined;

class CapabilitiesHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "capabilities";
    readonly inputSchema = inputSchema;

    mapFromStorage(persisted: unknown): CapabilitiesSettings {
        const stored = (persisted ?? {}) as PersistedCapabilities;
        return { items: stored.items ?? {} };
    }

    async mapToStorage(internal: unknown): Promise<PersistedCapabilities> {
        const input = internal as CapabilitiesSettings;

        // Normalise before testing for emptiness, so a row of untouched fields disappears rather
        // than persisting as a decision about nothing.
        const entries = Object.entries(input.items ?? {})
            // A type guard, not a plain predicate: a bare `Boolean(...)` filter reads the same but
            // narrows nothing, so the `undefined` this exists to drop would flow straight on.
            .filter((entry): entry is [string, AiCapabilityEntry] => Boolean(entry[1]))
            .map(([id, entry]) => {
                const normalised: AiCapabilityEntry = {
                    overrides: dropEmptyValues(entry.overrides ?? {})
                };

                const enabled = normaliseEnabled(entry.enabled);
                if (enabled === false) {
                    normalised.enabled = false;
                }

                return [id, normalised] as const;
            })
            .filter(([, entry]) => !isEmptyEntry(entry));

        return { items: Object.fromEntries(entries) };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: CapabilitiesHandlerImpl,
    dependencies: []
});
