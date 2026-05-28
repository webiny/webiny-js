import { createFeature } from "@webiny/feature/admin";
import { UpdateWebhookSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateWebhookSettingsUseCase } from "./UpdateWebhookSettingsUseCase.js";
import { UpdateWebhookSettingsGateway } from "./UpdateWebhookSettingsGateway.js";

export const UpdateWebhookSettingsFeature = createFeature({
    name: "Webhooks/UpdateWebhookSettings",
    register(container) {
        container.register(UpdateWebhookSettingsUseCase);
        container.register(UpdateWebhookSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
