import { createFeature } from "@webiny/feature/api";
import { BaseGraphQLSchema } from "./graphql/BaseGraphQLSchema.js";
import AiPowerUpsSettingsGraphQLMapperImpl from "./graphql/AiPowerUpsSettingsGraphQLMapper.js";
import { AiPowerUpsSettingsCache } from "./features/shared/SettingsCache.js";
import { GetSettingsFeature } from "./features/GetSettings/feature.js";
import { UpdateSettingsFeature } from "./features/UpdateSettings/feature.js";
import { WbGeneratePageContentFeature } from "./features/WbGeneratePageContent/feature.js";
import { ProvidersFeature } from "./features/Providers/feature.js";
import { ReaderPersonasFeature } from "./features/ReaderPersonas/feature.js";
import { WriterPersonasFeature } from "./features/WriterPersonas/feature.js";
import { ProjectsFeature } from "./features/Projects/feature.js";
import { AiPromptContextFeature } from "./features/AiPromptContext/feature.js";
import { AiImageEnrichmentFeature } from "./features/AiImageEnrichment/feature.js";
import { ExtractFrontmatterFeature } from "./features/ExtractFrontmatter/feature.js";
import { CmsGenerateEntryContentFeature } from "./features/CmsGenerateEntryContent/feature.js";
import { CmsResolveImageToolFeature } from "./features/CmsResolveImageTool/feature.js";
import { AiChatProviderFeature } from "./features/AiChatProvider/index.js";
import { CmsCompareEntryRevisionsFeature } from "./features/CmsCompareEntryRevisions/feature.js";
import { WbTranslatePageFeature } from "./features/WbTranslatePage/feature.js";
import { CmsCompareEntryRevisionsSchema } from "./graphql/CmsCompareEntryRevisionsSchema.js";

export const Extension = createFeature({
    name: "AiPowerUps",
    register(container) {
        container.register(AiPowerUpsSettingsCache).inSingletonScope();

        GetSettingsFeature.register(container);
        UpdateSettingsFeature.register(container);
        ProvidersFeature.register(container);
        ReaderPersonasFeature.register(container);
        WriterPersonasFeature.register(container);
        ProjectsFeature.register(container);
        AiPromptContextFeature.register(container);
        WbGeneratePageContentFeature.register(container);
        CmsGenerateEntryContentFeature.register(container);
        CmsResolveImageToolFeature.register(container);
        AiChatProviderFeature.register(container);
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
