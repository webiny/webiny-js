import { createFeature } from "@webiny/feature/admin";
import { GetWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWebhookUseCase } from "./GetWebhookUseCase.js";
import { GetWebhookGateway } from "./GetWebhookGateway.js";

export const GetWebhookFeature = createFeature({
    name: "Webhooks/GetWebhook",
    register(container) {
        container.register(GetWebhookUseCase);
        container.register(GetWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
