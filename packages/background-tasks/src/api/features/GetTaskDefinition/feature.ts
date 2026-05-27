import { createFeature } from "@webiny/feature/api";
import { GetTaskDefinitionUseCase } from "./GetTaskDefinitionUseCase.js";

export const GetTaskDefinitionFeature = createFeature({
    name: "GetTaskDefinition",
    register(container) {
        container.register(GetTaskDefinitionUseCase);
    }
});
