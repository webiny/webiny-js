import { createFeature } from "@webiny/feature/admin";
import { CreateEntryUseCase as UseCase } from "./abstractions.js";
import { CreateEntryUseCase } from "./CreateEntryUseCase.js";
import { CreateEntryRepository } from "./CreateEntryRepository.js";
import { CreateEntryGateway } from "./CreateEntryGateway.js";

export const CreateEntryFeature = createFeature({
    name: "CmsContentEntry/CreateEntry",
    register(container) {
        container.register(CreateEntryUseCase);
        container.register(CreateEntryRepository).inSingletonScope();
        container.register(CreateEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
