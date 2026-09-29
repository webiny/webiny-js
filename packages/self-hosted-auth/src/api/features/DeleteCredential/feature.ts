import { createFeature } from "@webiny/feature/api";
import { DeleteCredentialUseCase } from "./DeleteCredentialUseCase.js";

export const DeleteCredentialFeature = createFeature({
    name: "DeleteCredentialFeature",
    register(container) {
        container.register(DeleteCredentialUseCase);
    }
});
