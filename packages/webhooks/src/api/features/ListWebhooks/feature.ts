import { createFeature } from "@webiny/feature/api";
import { ListWebhooksUseCase } from "./ListWebhooksUseCase.js";
import { ListWebhooksRepository } from "./ListWebhooksRepository.js";

export const ListWebhooksFeature = createFeature({
    name: "ListWebhooks",
    register(container) {
        container.register(ListWebhooksUseCase);
        container.register(ListWebhooksRepository).inSingletonScope();
    }
});
