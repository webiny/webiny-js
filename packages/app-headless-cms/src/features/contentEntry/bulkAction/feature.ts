import { createFeature } from "@webiny/feature/admin";
import { BulkActionUseCase as UseCase } from "./abstractions.js";
import { BulkActionUseCase } from "./BulkActionUseCase.js";
import { BulkActionRepository } from "./BulkActionRepository.js";
import { BulkActionGateway } from "./BulkActionGateway.js";

export const BulkActionFeature = createFeature({
    name: "CmsContentEntry/BulkAction",
    register(container) {
        container.register(BulkActionUseCase);
        container.register(BulkActionRepository).inSingletonScope();
        container.register(BulkActionGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
