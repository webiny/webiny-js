import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { AI_MODEL_ROLE_IDS } from "~/api/features/ModelRoles/index.js";
import { AiCapability } from "./abstractions.js";
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
 * Keeps values that mean "not set" out of storage. The form sends `null` for an untouched field and
 * `false` for an untouched switch, and persisting those would mean every capability a project never
 * configured still occupies a key.
 */
const dropEmptyValues = (override: AiCapabilityOverride): AiCapabilityOverride =>
    Object.fromEntries(
        Object.entries(override).filter(
            ([, value]) => value !== null && value !== undefined && value !== "" && value !== false
        )
    ) as AiCapabilityOverride;

/**
 * Drops a stored prompt that is just a copy of ours.
 *
 * The admin pre-fills the prompt textarea with our own text so that flipping the switch shows you
 * what you are about to edit, and that default comes back on every save whether the switch is on or
 * not. Persisting it is what we must not do: a stored copy is a *frozen* copy, so flipping the
 * switch a year later would hand back whatever we shipped the day the row was written rather than
 * the current prompt. That is the append-by-default trap arrived at from the other direction.
 *
 * The test is whether the text differs from ours, not whether the switch is on. Keying off the
 * switch looked equivalent and was not: it threw away a prompt somebody had actually written the
 * moment they toggled the switch off and saved. Comparing content keeps that text, so toggling is
 * lossless, while still refusing to store a default nobody chose.
 */
const dropEchoedPrompt = (
    override: AiCapabilityOverride,
    ownGuidance: string | undefined
): AiCapabilityOverride => {
    const stored = override.guidance?.trim();

    if (!stored || stored !== (ownGuidance ?? "").trim()) {
        return override;
    }

    const { guidance: _echoed, ...rest } = override;
    return rest;
};

class CapabilitiesHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "capabilities";
    readonly inputSchema = inputSchema;

    private ownGuidance: Map<string, string | undefined>;

    constructor(capabilities: AiCapability.Interface[]) {
        this.ownGuidance = new Map(capabilities.map(c => [c.id, c.guidance]));
    }

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
            .map(
                ([id, override]) =>
                    [
                        id,
                        dropEchoedPrompt(dropEmptyValues(override), this.ownGuidance.get(id))
                    ] as const
            )
            .filter(([, override]) => !isEmptyOverride(override));

        return { overrides: Object.fromEntries(entries) };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: CapabilitiesHandlerImpl,
    dependencies: [[AiCapability, { multiple: true }]]
});
