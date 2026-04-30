import { createFeature } from "@webiny/feature/api";
import { ModelFieldCompression } from "./ModelFieldCompression.js";

export const ModelFieldCompressionFeature = createFeature({
    name: "Cms/ModelFieldCompression",
    register(container) {
        container.register(ModelFieldCompression).inSingletonScope();
    }
});
