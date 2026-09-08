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
    additionalInstructions: z.string().nullish(),
    replacePrompt: z.boolean().nullish(),
    guidance: z.string().nullish()
});

const inputSchema = z.object({
    overrides: z.record(z.string(), overrideSchema)
});

/** Keeps the persisted blob free of rows that only hold empty strings. */
const isEmptyOverride = (override: AiCapabilityOverride): boolean =>
    !override.roleId &&
    !override.connectionId &&
    !override.model &&
    !override.additionalInstructions?.trim() &&
    !override.replacePrompt &&
    !override.guidance?.trim();

/**
 * Keeps `null` and `""` out of storage. The form sends both for untouched fields, and persisting
 * them would mean every capability the project never configured still occupies a key.
 */
const dropEmptyValues = (override: AiCapabilityOverride): AiCapabilityOverride =>
    Object.fromEntries(
        Object.entries(override).filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
        )
    ) as AiCapabilityOverride;

/**
 * Drops a prompt the project has not actually taken ownership of.
 *
 * The admin pre-fills the prompt textarea with our own text so that flipping the switch shows you
 * what you are about to edit. That default came back on every save, switch on or off, so three
 * capabilities ended up storing a verbatim copy of a prompt nobody had touched.
 *
 * Behaviour was still correct, because resolution ignores `guidance` unless `replacePrompt` is set.
 * The damage was subtler: a stored copy is a *frozen* copy. Flip the switch on a year later and you
 * would get whatever we shipped the day the row was first saved, not the current prompt, which is
 * the exact trap the append-by-default design exists to avoid. Storing it only on explicit opt-in
 * keeps "you own it from now on" true at the moment it starts being true.
 */
const dropUnownedPrompt = (override: AiCapabilityOverride): AiCapabilityOverride => {
    if (override.replacePrompt) {
        return override;
    }

    const { guidance: _discarded, ...rest } = override;
    return rest;
};

class CapabilitiesHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "capabilities";
    readonly inputSchema = inputSchema;

    mapFromStorage(persisted: unknown): CapabilitiesSettings {
        const stored = (persisted ?? {}) as PersistedCapabilities;
        return { overrides: stored.overrides ?? {} };
    }

    async mapToStorage(internal: unknown): Promise<PersistedCapabilities> {
        const input = internal as CapabilitiesSettings;

        /*
         * Normalise before testing for emptiness, not after. A row holding nothing but the
         * pre-filled prompt is empty once that prompt is discarded, and it should disappear rather
         * than persist as an override of nothing.
         */
        const entries = Object.entries(input.overrides ?? {})
            .filter(([, override]) => Boolean(override))
            .map(([id, override]) => [id, dropUnownedPrompt(dropEmptyValues(override))] as const)
            .filter(([, override]) => !isEmptyOverride(override));

        return { overrides: Object.fromEntries(entries) };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: CapabilitiesHandlerImpl,
    dependencies: []
});
