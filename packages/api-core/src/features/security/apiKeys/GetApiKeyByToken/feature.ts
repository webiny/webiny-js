import { createFeature } from "@webiny/feature/api";
import { GetApiKeyByTokenUseCaseImpl } from "./GetApiKeyByTokenUseCase.js";

export const GetApiKeyByTokenFeature = createFeature({
    name: "GetApiKeyByToken",
    register(container) {
        container.register(GetApiKeyByTokenUseCaseImpl);
    }
});
