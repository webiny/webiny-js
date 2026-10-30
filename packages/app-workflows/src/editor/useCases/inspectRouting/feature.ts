import { createFeature } from "@webiny/feature/admin";
import { InspectRoutingUseCase as UseCaseAbstraction } from "./abstractions.js";
import { InspectRoutingUseCase } from "./InspectRoutingUseCase.js";

export const InspectRoutingFeature = createFeature({
    name: "Workflows/InspectRouting",
    register(container) {
        container.register(InspectRoutingUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
