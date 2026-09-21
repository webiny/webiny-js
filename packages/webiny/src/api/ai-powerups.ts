export { CmsGenerateEntryContentUseCase } from "@webiny/ai-powerups/api/features/CmsGenerateEntryContent/abstractions.js";
export { GetSettingsUseCase } from "@webiny/ai-powerups/api/features/GetSettings/abstractions.js";

/**
 * How an extension that adds an AI feature picks its model: register an `AiCapability` beside the
 * feature (which also gives it a row in Settings → AI Power-Ups, so the model is configurable
 * without code) and resolve it through `ResolveAiCapabilityUseCase`.
 *
 * Do not read `providers.presets[0]` from the settings blob. That section is legacy and nothing
 * writes it any more, so a project configured today has it empty and the feature reports "no AI
 * provider" while the admin plainly shows one.
 *
 * AI Power-Ups can be switched off entirely, in which case the resolver is not registered — declare
 * it as `[ResolveAiCapabilityUseCase, { optional: true }]`.
 */
export {
    AiCapability,
    ResolveAiCapabilityUseCase
} from "@webiny/ai-powerups/api/features/Capabilities/index.js";
export type {
    IAiCapability,
    IResolvedAiCapability
} from "@webiny/ai-powerups/api/features/Capabilities/index.js";
