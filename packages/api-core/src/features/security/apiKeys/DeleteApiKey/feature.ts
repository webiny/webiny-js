import { createFeature } from "@webiny/feature/api";
import { DeleteApiKeyUseCase } from "./DeleteApiKeyUseCase.js";

export const DeleteApiKeyFeature = createFeature({
    name: "DeleteApiKey",
    register(container) {
        container.register(DeleteApiKeyUseCase);
    }
});
