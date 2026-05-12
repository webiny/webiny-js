import { createFeature } from "@webiny/feature/api";
import ListWebhooksUseCaseImpl from "./ListWebhooksUseCase.js";
import ListWebhooksRepositoryImpl from "./ListWebhooksRepository.js";

export const ListWebhooksFeature = createFeature({
    name: "ListWebhooks",
    register(container) {
        container.register(ListWebhooksUseCaseImpl);
        container.register(ListWebhooksRepositoryImpl).inSingletonScope();
    }
});
