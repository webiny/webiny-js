import { createFeature } from "@webiny/feature/api";
import { BaseGraphQLSchema } from "./graphql/BaseGraphQLSchema.js";
import AiPowerUpsSettingsGraphQLMapperImpl from "./graphql/AiPowerUpsSettingsGraphQLMapper.js";
import { GetSettingsFeature } from "./features/GetSettings/feature.js";
import { UpdateSettingsFeature } from "./features/UpdateSettings/feature.js";
import { WbGeneratePageContentFeature } from "./features/WbGeneratePageContent/feature.js";
import { ProvidersFeature } from "./features/Providers/feature.js";
import { ReaderPersonasFeature } from "./features/ReaderPersonas/feature.js";
import { WriterPersonasFeature } from "./features/WriterPersonas/feature.js";

export const Extension = createFeature({
    name: "AiPowerUps",
    register(container) {
        GetSettingsFeature.register(container);
        UpdateSettingsFeature.register(container);
        WbGeneratePageContentFeature.register(container);
        ProvidersFeature.register(container);
        ReaderPersonasFeature.register(container);
        WriterPersonasFeature.register(container);

        container.register(AiPowerUpsSettingsGraphQLMapperImpl).inSingletonScope();
        container.register(BaseGraphQLSchema);
    }
});
