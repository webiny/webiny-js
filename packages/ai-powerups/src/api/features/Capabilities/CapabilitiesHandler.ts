import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { AI_MODEL_ROLE_IDS } from "~/api/features/ModelRoles/index.js";
import type { AiCapabilityOverride, CapabilitiesSettings, PersistedCapabilities } from "./types.js";

const overrideSchema = z.object({
    roleId: z.union([z.enum(AI_MODEL_ROLE_IDS), z.literal("")]).optional(),
    connectionId: z.string().optional(),
    model: z.string().optional(),
    additionalInstructions: z.string().optional(),
    replacePrompt: z.boolean().optional(),
    guidance: z.string().optional()
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

class CapabilitiesHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "capabilities";
    readonly inputSchema = inputSchema;

    mapFromStorage(persisted: unknown): CapabilitiesSettings {
        const stored = (persisted ?? {}) as PersistedCapabilities;
        return { overrides: stored.overrides ?? {} };
    }

    async mapToStorage(internal: unknown): Promise<PersistedCapabilities> {
        const input = internal as CapabilitiesSettings;
        const entries = Object.entries(input.overrides ?? {}).filter(
            ([, override]) => override && !isEmptyOverride(override)
        );

        return { overrides: Object.fromEntries(entries) };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: CapabilitiesHandlerImpl,
    dependencies: []
});
