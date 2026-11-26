import { createFeature } from "@webiny/feature/admin";
import { GetLatestSingletonEntryUseCase as UseCase } from "./abstractions.js";
import { GetLatestSingletonEntryUseCase } from "./GetLatestSingletonEntryUseCase.js";
import { GetLatestSingletonEntryGateway } from "./GetLatestSingletonEntryGateway.js";

export const GetLatestSingletonEntryFeature = createFeature({
    name: "CmsContentEntry/GetLatestSingletonEntry",
    register(container) {
        container.register(GetLatestSingletonEntryUseCase);
        container.register(GetLatestSingletonEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
