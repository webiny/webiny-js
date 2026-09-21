import { createFeature } from "@webiny/feature/api";
import { GetRunnableTaskDefinitionUseCase } from "./GetRunnableTaskDefinitionUseCase.js";

export const GetRunnableTaskDefinitionFeature = createFeature({
    name: "GetRunnableTaskDefinition",
    register(container) {
        container.register(GetRunnableTaskDefinitionUseCase);
    }
});
