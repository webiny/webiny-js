import { createFeature } from "@webiny/feature/api";
import { BaseGraphQLSchema } from "./graphql/BaseGraphQLSchema.js";
import { GetSettingsFeature } from "./features/GetSettings/feature.js";
import { UpdateSettingsFeature } from "./features/UpdateSettings/feature.js";
import { WbGeneratePageContentFeature } from "./features/WbGeneratePageContent/feature.js";

export const Extension = createFeature({
    name: "AiPowerUps",
    register(container) {
        GetSettingsFeature.register(container);
        UpdateSettingsFeature.register(container);
        WbGeneratePageContentFeature.register(container);

        container.register(BaseGraphQLSchema);
    }
});
