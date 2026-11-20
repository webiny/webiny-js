import { createFeature } from "@webiny/feature/admin";
import { ListLayoutsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListLayoutsUseCase } from "./ListLayoutsUseCase.js";

export const ListLayoutsFeature = createFeature({
    name: "WebsiteBuilder/ListLayouts",
    register(container) {
        container.register(ListLayoutsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
