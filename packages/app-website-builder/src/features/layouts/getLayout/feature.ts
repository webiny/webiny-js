import { createFeature } from "@webiny/feature/admin";
import { GetLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetLayoutUseCase } from "./GetLayoutUseCase.js";

export const GetLayoutFeature = createFeature({
    name: "WebsiteBuilder/GetLayout",
    register(container) {
        container.register(GetLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
