import { createFeature } from "@webiny/feature/admin";
import { ListAvailableEventsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAvailableEventsUseCase } from "./ListAvailableEventsUseCase.js";
import { ListAvailableEventsGateway } from "./ListAvailableEventsGateway.js";

export const ListAvailableEventsFeature = createFeature({
    name: "Webhooks/ListAvailableEvents",
    register(container) {
        container.register(ListAvailableEventsUseCase);
        container.register(ListAvailableEventsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
