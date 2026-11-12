import { createFeature } from "@webiny/feature/api";
import { SendPasswordResetCodeTaskDefinition } from "./SendPasswordResetCodeTask.js";

export const SendPasswordResetCodeFeature = createFeature({
    name: "SendPasswordResetCodeFeature",
    register(container) {
        container.register(SendPasswordResetCodeTaskDefinition);
    }
});
