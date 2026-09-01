import { createFeature } from "@webiny/feature/admin";
import { GetContentEntriesUseCase as UseCase } from "./abstractions.js";
import { GetContentEntriesUseCase } from "./GetContentEntriesUseCase.js";
import { GetContentEntriesGateway } from "./GetContentEntriesGateway.js";

export const GetContentEntriesFeature = createFeature({
    name: "CmsContentEntry/GetContentEntries",
    register(container) {
        container.register(GetContentEntriesUseCase);
        container.register(GetContentEntriesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
