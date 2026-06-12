import { createFeature } from "@webiny/feature/admin";
import { ListNotificationTypesGateway } from "./ListNotificationTypesGateway.js";
import { ListNotificationTypesUseCase } from "./ListNotificationTypesUseCase.js";

export const ListNotificationTypesFeature = createFeature({
    name: "Workflows/ListNotificationTypes",
    register(container) {
        container.register(ListNotificationTypesGateway).inSingletonScope();
        container.register(ListNotificationTypesUseCase);
    }
});
