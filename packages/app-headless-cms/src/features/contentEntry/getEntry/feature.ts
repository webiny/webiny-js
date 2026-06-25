import { createFeature } from "@webiny/feature/admin";
import { GetEntryUseCase as UseCase } from "./abstractions.js";
import { GetEntryUseCase } from "./GetEntryUseCase.js";
import { GetEntryRepository } from "./GetEntryRepository.js";
import { GetEntryGateway } from "./GetEntryGateway.js";

export const GetEntryFeature = createFeature({
    name: "CmsContentEntry/GetEntry",
    register(container) {
        container.register(GetEntryUseCase);
        container.register(GetEntryRepository).inSingletonScope();
        container.register(GetEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
