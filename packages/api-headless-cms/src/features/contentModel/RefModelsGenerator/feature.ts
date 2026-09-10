import { createFeature } from "@webiny/feature/api";
import { RefModelsGenerator } from "./RefModelsGenerator.js";

export const RefModelsGeneratorFeature = createFeature({
    name: "RefModelsGenerator",
    register(container) {
        container.register(RefModelsGenerator);
    }
});
