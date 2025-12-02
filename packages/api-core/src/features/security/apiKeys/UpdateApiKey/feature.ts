import { createFeature } from "@webiny/feature/api";
import { UpdateApiKeyUseCaseImpl } from "./UpdateApiKeyUseCase.js";

export const UpdateApiKeyFeature = createFeature({
    name: "UpdateApiKey",
    register(container) {
        container.register(UpdateApiKeyUseCaseImpl);
    }
});
