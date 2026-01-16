import { createFeature } from "@webiny/feature/api";
import { CreateApiKeyUseCase } from "./CreateApiKeyUseCase.js";

export const CreateApiKeyFeature = createFeature({
    name: "CreateApiKey",
    register(container) {
        container.register(CreateApiKeyUseCase);
    }
});
