import { createFeature } from "@webiny/feature/admin";
import { DeleteLayoutRevisionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteLayoutRevisionUseCase } from "./DeleteLayoutRevisionUseCase.js";

export const DeleteLayoutRevisionFeature = createFeature({
    name: "WebsiteBuilder/DeleteLayoutRevision",
    register(container) {
        container.register(DeleteLayoutRevisionUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
