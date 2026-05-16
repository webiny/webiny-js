import { createFeature } from "@webiny/feature/admin";
import { ListWebhooksUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWebhooksUseCase } from "./ListWebhooksUseCase.js";
import { ListWebhooksRepository } from "./ListWebhooksRepository.js";
import { ListWebhooksGateway } from "./ListWebhooksGateway.js";

export const ListWebhooksFeature = createFeature({
    name: "Webhooks/ListWebhooks",
    register(container) {
        container.register(ListWebhooksUseCase);
        container.register(ListWebhooksRepository).inSingletonScope();
        container.register(ListWebhooksGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
