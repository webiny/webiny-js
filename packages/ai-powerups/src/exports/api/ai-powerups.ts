// CmsGenerateEntryContent — generate CMS entry content with AI, following the user's
// configured provider and (optionally) a Writer Persona.
export { CmsGenerateEntryContentUseCase } from "~/api/features/CmsGenerateEntryContent/abstractions.js";

export { GetSettingsUseCase } from "~/api/features/GetSettings/abstractions.js";

/*
 * Capabilities — how anything outside this package asks "which model runs this feature?".
 *
 * `ResolveAiCapabilityUseCase` is the only supported answer: it applies the precedence rules
 * (pinned model → chosen role → declared default role → `standard`), checks the model against its
 * connection's vendor and decrypts the key. Reading `providers.presets[0]` was the old way and is
 * dead — nothing writes that section any more (`Connections/legacyProviders.ts`).
 *
 * Register an `AiCapability` beside the feature and the settings screen gains a row for it, so a
 * project can point that one feature at a different model without touching code.
 *
 * The whole extension is unregistered when AI Power-Ups is off, so a consumer must depend on the
 * resolver as `[ResolveAiCapabilityUseCase, { optional: true }]` and say something useful when it
 * is absent.
 */
export { AiCapability, ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
export type { IAiCapability, IResolvedAiCapability } from "~/api/features/Capabilities/index.js";
