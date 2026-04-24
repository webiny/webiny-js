import { createFeature } from "@webiny/feature/api";
import { UpdateApiKeyUseCase } from "./UpdateApiKeyUseCase.js";

export const UpdateApiKeyFeature = createFeature({
    name: "UpdateApiKey",
    register(container) {
        container.register(UpdateApiKeyUseCase);
    }
});
