import { createFeature } from "@webiny/feature/api";
import { SendPasswordResetCodeUseCase } from "./SendPasswordResetCodeUseCase.js";
import { SendPasswordResetCodeTaskDefinition } from "./SendPasswordResetCodeTask.js";

export const SendPasswordResetCodeFeature = createFeature({
    name: "SendPasswordResetCodeFeature",
    register(container) {
        container.register(SendPasswordResetCodeUseCase);
        container.register(SendPasswordResetCodeTaskDefinition);
    }
});
