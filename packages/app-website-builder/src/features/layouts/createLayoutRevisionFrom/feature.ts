import { createFeature } from "@webiny/feature/admin";
import { CreateLayoutRevisionFromUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateLayoutRevisionFromUseCase } from "./CreateLayoutRevisionFromUseCase.js";

export const CreateLayoutRevisionFromFeature = createFeature({
    name: "WebsiteBuilder/CreateLayoutRevisionFrom",
    register(container) {
        container.register(CreateLayoutRevisionFromUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
