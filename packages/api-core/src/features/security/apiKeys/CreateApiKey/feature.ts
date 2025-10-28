import { createFeature } from "@webiny/feature/api";
import { CreateApiKeyUseCaseImpl } from "./CreateApiKeyUseCase.js";

export const CreateApiKeyFeature = createFeature({
    name: "CreateApiKey",
    register(container) {
        container.register(CreateApiKeyUseCaseImpl);
    }
});
