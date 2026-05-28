import { createFeature } from "@webiny/feature/admin";
import { GetWebhookSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWebhookSettingsUseCase } from "./GetWebhookSettingsUseCase.js";
import { GetWebhookSettingsGateway } from "./GetWebhookSettingsGateway.js";

export const GetWebhookSettingsFeature = createFeature({
    name: "Webhooks/GetWebhookSettings",
    register(container) {
        container.register(GetWebhookSettingsUseCase);
        container.register(GetWebhookSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
