import { createFeature } from "@webiny/feature/api";
import TriggerWebhookUseCaseImpl from "./TriggerWebhookUseCase.js";

export const TriggerWebhookFeature = createFeature({
    name: "TriggerWebhook",
    register(container) {
        container.register(TriggerWebhookUseCaseImpl);
    }
});
