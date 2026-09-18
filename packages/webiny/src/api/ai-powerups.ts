export { CmsGenerateEntryContentUseCase } from "@webiny/ai-powerups/api/features/CmsGenerateEntryContent/abstractions.js";
export { GetSettingsUseCase } from "@webiny/ai-powerups/api/features/GetSettings/abstractions.js";

/*
 * Capabilities are how a feature asks AI Power-Ups for a model. Registering one also gives the
 * feature a row in the AI settings screen, so a project can point it at a different model or append
 * instructions — that works for an extension's capability exactly as it does for a built-in one.
 */
export { AiCapability } from "@webiny/ai-powerups/api/features/Capabilities/abstractions.js";
export { ResolveAiCapabilityUseCase } from "@webiny/ai-powerups/api/features/Capabilities/abstractions.js";
export type { IAiCapability } from "@webiny/ai-powerups/api/features/Capabilities/abstractions.js";
export type { IResolvedAiCapability } from "@webiny/ai-powerups/api/features/Capabilities/abstractions.js";
export { withAdditionalInstructions } from "@webiny/ai-powerups/api/features/Capabilities/index.js";
export { AI_MODEL_ROLE_IDS } from "@webiny/ai-powerups/api/features/ModelRoles/index.js";
export type { AiModelRoleId } from "@webiny/ai-powerups/api/features/ModelRoles/index.js";
