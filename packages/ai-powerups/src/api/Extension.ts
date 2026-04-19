import { createFeature } from "@webiny/feature/api";
import { BaseGraphQLSchema } from "./graphql/BaseGraphQLSchema.js";
import { GetSettingsFeature } from "./features/GetSettings/feature.js";
import { SaveSettingsFeature } from "./features/SaveSettings/feature.js";

export const Extension = createFeature({
    name: "AiPowerups",
    register(container) {
        GetSettingsFeature.register(container);
        SaveSettingsFeature.register(container);

        container.register(BaseGraphQLSchema);
    }
});
