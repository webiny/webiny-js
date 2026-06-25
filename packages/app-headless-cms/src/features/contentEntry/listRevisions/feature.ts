import { createFeature } from "@webiny/feature/admin";
import { ListRevisionsUseCase as UseCase } from "./abstractions.js";
import { ListRevisionsUseCase } from "./ListRevisionsUseCase.js";
import { ListRevisionsRepository } from "./ListRevisionsRepository.js";
import { ListRevisionsGateway } from "./ListRevisionsGateway.js";

export const ListRevisionsFeature = createFeature({
    name: "CmsContentEntry/ListRevisions",
    register(container) {
        container.register(ListRevisionsUseCase);
        container.register(ListRevisionsRepository).inSingletonScope();
        container.register(ListRevisionsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
