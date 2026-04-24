import { createFeature } from "@webiny/feature/api";
import { GetApiKeyUseCase } from "./GetApiKeyUseCase.js";

export const GetApiKeyFeature = createFeature({
    name: "GetApiKey",
    register(container) {
        container.register(GetApiKeyUseCase);
    }
});
