import { createFeature } from "@webiny/feature/api";
import { createMemoryCache } from "~/utils/index.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/PluginModelsProvider.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { ModelToAstConverter } from "~/features/contentModel/shared/ModelToAstConverter.js";

export const ContentModelFeature = createFeature({
    name: "ContentModel",
    register(container) {
        container.registerInstance(ModelCache, createMemoryCache());
        container.register(PluginModelsProvider).inSingletonScope();
        container.register(ModelToAstConverter);

        // Query features

        // Command features
    }
});
