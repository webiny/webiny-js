import { createFeature } from "@webiny/feature/api";
import { GetApiKeyByTokenUseCase } from "./GetApiKeyByTokenUseCase.js";

export const GetApiKeyByTokenFeature = createFeature({
    name: "GetApiKeyByToken",
    register(container) {
        container.register(GetApiKeyByTokenUseCase);
    }
});
