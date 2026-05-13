import { createFeature } from "@webiny/feature/api";
import { TriggerWebhookUseCase } from "./TriggerWebhookUseCase.js";

export const TriggerWebhookFeature = createFeature({
    name: "TriggerWebhook",
    register(container) {
        container.register(TriggerWebhookUseCase);
    }
});
