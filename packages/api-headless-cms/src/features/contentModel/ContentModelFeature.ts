import { createFeature } from "@webiny/feature/api";
import { createMemoryCache } from "~/utils/index.js";
import { PluginModelsProvider } from "./shared/PluginModelsProvider.js";
import { ModelCache } from "./shared/abstractions.js";
import { ModelsFetcher } from "./shared/ModelsFetcher.js";
import { CreateModelFeature } from "./CreateModel/feature.js";
import { CreateModelFromFeature } from "./CreateModelFrom/feature.js";
import { UpdateModelFeature } from "./UpdateModel/feature.js";
import { DeleteModelFeature } from "./DeleteModel/feature.js";
import { GetModelFeature } from "./GetModel/feature.js";
import { ListModelsFeature } from "./ListModels/feature.js";
import { ModelToAstConverterFeature } from "./ModelToAstConverter/feature.js";
import { ValuesSelectionGeneratorFeature } from "./ValuesSelectionGenerator/feature.js";
import { ModelFieldCompressionFeature } from "./ModelFieldCompression/feature.js";

export const ContentModelFeature = createFeature({
    name: "ContentModel",
    register(container) {
        container.registerInstance(ModelCache, createMemoryCache());
        container.register(PluginModelsProvider).inSingletonScope();
        container.register(ModelsFetcher).inSingletonScope();

        ModelToAstConverterFeature.register(container);
        ValuesSelectionGeneratorFeature.register(container);

        ModelFieldCompressionFeature.register(container);

        // Query features
        GetModelFeature.register(container);
        ListModelsFeature.register(container);

        // Command features
        CreateModelFeature.register(container);
        CreateModelFromFeature.register(container);
        UpdateModelFeature.register(container);
        DeleteModelFeature.register(container);
    }
});
