import { createFeature } from "@webiny/feature/api";
import { ModelToAstConverter } from "./ModelToAstConverter.js";

export const ModelToAstConverterFeature = createFeature({
    name: "ModelToAstConverter",
    register(container) {
        container.register(ModelToAstConverter);
    }
});
