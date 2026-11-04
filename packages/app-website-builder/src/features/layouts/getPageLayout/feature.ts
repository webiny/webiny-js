import { createFeature } from "@webiny/feature/admin";
import { GetPageLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPageLayoutUseCase } from "./GetPageLayoutUseCase.js";

export const GetPageLayoutFeature = createFeature({
    name: "WebsiteBuilder/GetPageLayout",
    register(container) {
        container.register(GetPageLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
