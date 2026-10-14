import zod from "zod";

/** The stored config of an "automation" step (R133). */
export interface AutomationStepConfig {
    automationId: string;
    /** Validated against the definition's `settingsSchema`; stored as the author entered them and parsed again on every use. */
    settings: Record<string, unknown>;
}

/**
 * The shell of an automation step's config: which automation, and its settings. The settings
 * themselves are validated against the chosen definition's `settingsSchema`, not here. This is
 * the step type's `configSchema` (what `listStepTypes` returns); the editor gets the settings
 * schema per automation from `listAutomationDefinitions`.
 */
export const automationStepConfigSchema = zod.object({
    automationId: zod.string().min(1),
    settings: zod.record(zod.string(), zod.unknown())
});
