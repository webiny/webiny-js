/*
 * `IAiPowerUpsSettings` is an empty interface that each settings group fills in by declaration
 * merging. The package's emitted .d.ts still carries the unresolved `~/...` specifiers that pull
 * those augmentations in, so without these imports anything reading settings through this module
 * sees an empty object. Importing them here is what makes `settings.providers` visible to
 * extensions, which cannot import `@webiny/*` directly.
 */
import "@webiny/ai-powerups/api/features/Providers/types.js";
import "@webiny/ai-powerups/api/features/Projects/types.js";

export { CmsGenerateEntryContentUseCase } from "@webiny/ai-powerups/api/features/CmsGenerateEntryContent/abstractions.js";
export { GetSettingsUseCase } from "@webiny/ai-powerups/api/features/GetSettings/abstractions.js";
export type { ProviderPreset } from "@webiny/ai-powerups/api/features/Providers/types.js";
