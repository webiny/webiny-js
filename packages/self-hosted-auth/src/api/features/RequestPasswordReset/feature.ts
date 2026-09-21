import { createFeature } from "@webiny/feature/api";
import { RequestPasswordResetUseCase } from "./RequestPasswordResetUseCase.js";

export const RequestPasswordResetFeature = createFeature({
    name: "RequestPasswordResetFeature",
    register(container) {
        container.register(RequestPasswordResetUseCase);
    }
});
