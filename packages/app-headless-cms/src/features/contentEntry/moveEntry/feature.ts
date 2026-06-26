import { createFeature } from "@webiny/feature/admin";
import { MoveEntryUseCase as UseCase } from "./abstractions.js";
import { MoveEntryUseCase } from "./MoveEntryUseCase.js";
import { MoveEntryRepository } from "./MoveEntryRepository.js";
import { MoveEntryGateway } from "./MoveEntryGateway.js";

export const MoveEntryFeature = createFeature({
    name: "CmsContentEntry/MoveEntry",
    register(container) {
        container.register(MoveEntryUseCase);
        container.register(MoveEntryRepository).inSingletonScope();
        container.register(MoveEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
