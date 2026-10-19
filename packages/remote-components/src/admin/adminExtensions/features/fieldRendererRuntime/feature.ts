import { createFeature } from "@webiny/feature/admin";
import { FieldRendererEvaluator } from "./FieldRendererEvaluator.js";

export const FieldRendererRuntimeFeature = createFeature({
    name: "RemoteComponents/FieldRendererRuntime",
    register(container) {
        container.register(FieldRendererEvaluator).inSingletonScope();
    }
});
