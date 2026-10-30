import { createFeature } from "@webiny/feature/admin";
import { ListNotificationTransportsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListNotificationTransportsUseCase } from "./ListNotificationTransportsUseCase.js";

export const ListNotificationTransportsFeature = createFeature({
    name: "Workflows/ListNotificationTransports",
    register(container) {
        container.register(ListNotificationTransportsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
