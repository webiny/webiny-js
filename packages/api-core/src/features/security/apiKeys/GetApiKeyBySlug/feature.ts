import { createFeature } from "@webiny/feature/api";
import { GetApiKeyBySlugUseCaseImpl } from "./GetApiKeyBySlugUseCase.js";

export const GetApiKeyBySlugFeature = createFeature({
    name: "GetApiKeyBySlug",
    register(container) {
        container.register(GetApiKeyBySlugUseCaseImpl);
    }
});
