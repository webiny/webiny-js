import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { BaseGraphQLSchema } from "./graphql/BaseGraphQLSchema.js";
import AiPowerUpsSettingsGraphQLMapperImpl from "./graphql/AiPowerUpsSettingsGraphQLMapper.js";
import { AiPowerUpsSettingsCache } from "./features/shared/SettingsCache.js";
import { GetSettingsFeature } from "./features/GetSettings/feature.js";
import { UpdateSettingsFeature } from "./features/UpdateSettings/feature.js";
import { WbGeneratePageContentFeature } from "./features/WbGeneratePageContent/feature.js";
import { ProvidersFeature } from "./features/Providers/feature.js";
import { ConnectionsFeature } from "./features/Connections/feature.js";
import { ModelRolesFeature } from "./features/ModelRoles/feature.js";
import { CapabilitiesFeature } from "./features/Capabilities/feature.js";
import { ReaderPersonasFeature } from "./features/ReaderPersonas/feature.js";
import { WriterPersonasFeature } from "./features/WriterPersonas/feature.js";
import { ProjectsFeature } from "./features/Projects/feature.js";
import { AiPromptContextFeature } from "./features/AiPromptContext/feature.js";
import { AiImageEnrichmentFeature } from "./features/AiImageEnrichment/feature.js";
import { ExtractFrontmatterFeature } from "./features/ExtractFrontmatter/feature.js";
import { CmsGenerateEntryContentFeature } from "./features/CmsGenerateEntryContent/feature.js";
import { CmsResolveImageToolFeature } from "./features/CmsResolveImageTool/feature.js";
import { AiChatResolverFeature } from "./features/AiChatResolver/index.js";
import { CmsCompareEntryRevisionsFeature } from "./features/CmsCompareEntryRevisions/feature.js";
import { WbTranslatePageFeature } from "./features/WbTranslatePage/feature.js";
import { CmsCompareEntryRevisionsSchema } from "./graphql/CmsCompareEntryRevisionsSchema.js";

export const Extension = createFeature({
    name: "AiPowerUps",
    register(container) {
        /*
         * The whole extension is gated here rather than around `<Api.Extension>` in
         * `AiPowerups.tsx`. That wrapper read project config while the project graph was built, so
         * a licence bought after the last deploy did nothing until the next one.
         *
         * Register time is early enough and the flags are correct here: `registerApiRequestStack`
         * refreshes the WCP licence before any feature registers, so `isEnabled` sees the effective
         * flags (project config && live licence). `AcoFeature` and `AiChatFeature` gate the same
         * way.
         *
         * Nothing is registered when it is off, so a project without AI Power-Ups has no settings
         * schema and no capability resolver at all, rather than ones that fail on use. Anything
         * outside this extension that wants a capability must therefore declare
         * `[ResolveAiCapabilityUseCase, { optional: true }]` and handle its absence.
         */
        if (!container.resolve(FeatureFlags).get().isEnabled("aiPowerups")) {
            return;
        }

        container.register(AiPowerUpsSettingsCache).inSingletonScope();

        GetSettingsFeature.register(container);
        UpdateSettingsFeature.register(container);
        /*
         * `ProvidersFeature` is still registered so the legacy `providers` section keeps round-
         * tripping through storage. `Connections` and `ModelRoles` read it once to seed
         * themselves; nothing else does. It goes away with the next breaking release.
         */
        ProvidersFeature.register(container);
        ConnectionsFeature.register(container);
        ModelRolesFeature.register(container);
        CapabilitiesFeature.register(container);
        ReaderPersonasFeature.register(container);
        WriterPersonasFeature.register(container);
        ProjectsFeature.register(container);
        AiPromptContextFeature.register(container);
        WbGeneratePageContentFeature.register(container);
        CmsGenerateEntryContentFeature.register(container);
        CmsResolveImageToolFeature.register(container);
        AiChatResolverFeature.register(container);
        ExtractFrontmatterFeature.register(container);

        // Registered unconditionally. The WCP license gate lives inside the feature's
        // FileAfterCreate handler (trigger-time), because the license isn't loaded yet during this
        // register() phase — a register-time canUse* check reads NullLicense and is always false.
        AiImageEnrichmentFeature.register(container);

        CmsCompareEntryRevisionsFeature.register(container);
        WbTranslatePageFeature.register(container);

        container.register(AiPowerUpsSettingsGraphQLMapperImpl).inSingletonScope();
        container.register(BaseGraphQLSchema);
        container.register(CmsCompareEntryRevisionsSchema);
    }
});
