import { createFeature } from "@webiny/feature/api";
import { FieldBuilderRegistry } from "./fields/FieldBuilderRegistry.js";
import { TextFieldType } from "./fields/TextFieldType.js";
import { PublicModelProvider } from "./models/PublicModelProvider.js";
import { PrivateModelProvider } from "./models/PrivateModelProvider.js";
import { ModelsProvider } from "./models/ModelsProvider.js";

export const ModelBuilderFeature = createFeature({
    name: "ModelBuilder",
    register(container) {
        // Register core field types
        container.register(TextFieldType);

        // Register field builder registry (will automatically get all FieldType implementations)
        container.register(FieldBuilderRegistry).inSingletonScope();

        // Register model providers
        container.register(PublicModelProvider).inSingletonScope();
        container.register(PrivateModelProvider).inSingletonScope();
        container.register(ModelsProvider).inSingletonScope();
    }
});
