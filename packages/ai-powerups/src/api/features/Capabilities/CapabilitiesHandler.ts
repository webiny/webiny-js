import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { AI_MODEL_ROLE_IDS } from "~/api/features/ModelRoles/index.js";
import type { AiCapabilityOverride, CapabilitiesSettings, PersistedCapabilities } from "./types.js";

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

const inputSchema = z.object({
    overrides: z.record(z.string(), overrideSchema)
});

/** Keeps the persisted blob free of rows that only hold empty strings. */
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

class CapabilitiesHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "capabilities";
    readonly inputSchema = inputSchema;

    mapFromStorage(persisted: unknown): CapabilitiesSettings {
        const stored = (persisted ?? {}) as PersistedCapabilities;
        return { overrides: stored.overrides ?? {} };
    }

    async mapToStorage(internal: unknown): Promise<PersistedCapabilities> {
        const input = internal as CapabilitiesSettings;

        // Normalise before testing for emptiness, so a row of untouched fields disappears rather
        // than persisting as an override of nothing.
        const entries = Object.entries(input.overrides ?? {})
            .filter(([, override]) => Boolean(override))
            .map(([id, override]) => [id, dropEmptyValues(override)] as const)
            .filter(([, override]) => !isEmptyOverride(override));

        return { overrides: Object.fromEntries(entries) };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: CapabilitiesHandlerImpl,
    dependencies: []
});
