import { createFeature } from "@webiny/feature/api";
import { GetApiKeyUseCaseImpl } from "./GetApiKeyUseCase.js";

export const GetApiKeyFeature = createFeature({
    name: "GetApiKey",
    register(container) {
        container.register(GetApiKeyUseCaseImpl);
    }
});
