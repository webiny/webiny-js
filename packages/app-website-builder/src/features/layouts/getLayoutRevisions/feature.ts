import { createFeature } from "@webiny/feature/admin";
import { GetLayoutRevisionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetLayoutRevisionsUseCase } from "./GetLayoutRevisionsUseCase.js";

export const GetLayoutRevisionsFeature = createFeature({
    name: "WebsiteBuilder/GetLayoutRevisions",
    register(container) {
        container.register(GetLayoutRevisionsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
