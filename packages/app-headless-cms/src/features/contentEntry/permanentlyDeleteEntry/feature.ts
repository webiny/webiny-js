import { createFeature } from "@webiny/feature/admin";
import { PermanentlyDeleteEntryUseCase as UseCase } from "./abstractions.js";
import { PermanentlyDeleteEntryUseCase } from "./PermanentlyDeleteEntryUseCase.js";
import { PermanentlyDeleteEntryRepository } from "./PermanentlyDeleteEntryRepository.js";
import { PermanentlyDeleteEntryGateway } from "./PermanentlyDeleteEntryGateway.js";

export const PermanentlyDeleteEntryFeature = createFeature({
    name: "CmsContentEntry/PermanentlyDeleteEntry",
    register(container) {
        container.register(PermanentlyDeleteEntryUseCase);
        container.register(PermanentlyDeleteEntryRepository).inSingletonScope();
        container.register(PermanentlyDeleteEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
