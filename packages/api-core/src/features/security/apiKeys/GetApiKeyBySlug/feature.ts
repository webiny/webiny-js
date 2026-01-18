import { createFeature } from "@webiny/feature/api";
import { GetApiKeyBySlugUseCase } from "./GetApiKeyBySlugUseCase.js";

export const GetApiKeyBySlugFeature = createFeature({
    name: "GetApiKeyBySlug",
    register(container) {
        container.register(GetApiKeyBySlugUseCase);
    }
});
