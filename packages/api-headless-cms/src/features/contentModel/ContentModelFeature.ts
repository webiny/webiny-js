import { createFeature } from "@webiny/feature/api";
import { createMemoryCache } from "~/utils/index.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/PluginModelsProvider.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { ModelsFetcher } from "~/features/contentModel/shared/ModelsFetcher.js";
import { CreateModelFeature } from "~/features/contentModel/CreateModel/feature.js";
import { CreateModelFromFeature } from "~/features/contentModel/CreateModelFrom/feature.js";
import { UpdateModelFeature } from "~/features/contentModel/UpdateModel/feature.js";
import { DeleteModelFeature } from "~/features/contentModel/DeleteModel/feature.js";
import { InitializeModelFeature } from "~/features/contentModel/InitializeModel/feature.js";
import { GetModelFeature } from "~/features/contentModel/GetModel/feature.js";
import { ListModelsFeature } from "~/features/contentModel/ListModels/feature.js";
import { ModelToAstConverterFeature } from "~/features/contentModel/ModelToAstConverter/feature.js";

export const ContentModelFeature = createFeature({
    name: "ContentModel",
    register(container) {
        container.registerInstance(ModelCache, createMemoryCache());
        container.register(PluginModelsProvider).inSingletonScope();
        container.register(ModelsFetcher).inSingletonScope();

        ModelToAstConverterFeature.register(container);

        // Query features
        GetModelFeature.register(container);
        ListModelsFeature.register(container);

        // Command features
        CreateModelFeature.register(container);
        CreateModelFromFeature.register(container);
        UpdateModelFeature.register(container);
        DeleteModelFeature.register(container);
        InitializeModelFeature.register(container);
    }
});
