import { createFeature } from "@webiny/feature/admin";
import { ListPagesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListPagesUseCase } from "./ListPagesUseCase.js";
import { ListPagesRepository } from "./ListPagesRepository.js";
import { ListPagesGateway } from "./ListPagesGateway.js";

export const ListPagesFeature = createFeature({
    name: "WebsiteBuilder/ListPages",
    register(container) {
        container.register(ListPagesUseCase);
        container.register(ListPagesRepository).inSingletonScope();
        container.register(ListPagesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
