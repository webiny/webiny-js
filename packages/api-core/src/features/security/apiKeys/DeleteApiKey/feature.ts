import { createFeature } from "@webiny/feature/api";
import { DeleteApiKeyUseCaseImpl } from "./DeleteApiKeyUseCase.js";

export const DeleteApiKeyFeature = createFeature({
    name: "DeleteApiKey",
    register(container) {
        container.register(DeleteApiKeyUseCaseImpl);
    }
});
