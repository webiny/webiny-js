// CmsGenerateEntryContent — generate CMS entry content with AI, following the user's
// configured provider and (optionally) a Writer Persona.
export { CmsGenerateEntryContentUseCase } from "~/api/features/CmsGenerateEntryContent/abstractions.js";

export { GetSettingsUseCase } from "~/api/features/GetSettings/abstractions.js";

// Capabilities are how a feature asks AI Power-Ups for a model. Registering one also gives the
// feature a row in the AI settings screen, so a project can point it at a different model or
// append instructions. That works for an extension's capability exactly as for a built-in one.
export { AiCapability } from "~/api/features/Capabilities/abstractions.js";
export { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/abstractions.js";
export { withAdditionalInstructions } from "~/api/features/Capabilities/index.js";
export { AI_MODEL_ROLE_IDS } from "~/api/features/ModelRoles/index.js";
export type { AiModelRoleId } from "~/api/features/ModelRoles/index.js";
