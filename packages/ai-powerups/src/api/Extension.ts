import { createFeature } from "@webiny/feature/api";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
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
        ExtractFrontmatterFeature.register(container);

        const wcp = container.resolve(WcpContext);
        if (wcp.canUseAiImageEnrichment()) {
            AiImageEnrichmentFeature.register(container);
        }

        container.register(AiPowerUpsSettingsGraphQLMapperImpl).inSingletonScope();
        container.register(BaseGraphQLSchema);
    }
});
