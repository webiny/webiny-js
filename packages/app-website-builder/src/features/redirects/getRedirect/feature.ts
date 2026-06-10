import { createFeature } from "@webiny/feature/admin";
import { GetRedirectUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRedirectUseCase } from "./GetRedirectUseCase.js";
import { GetRedirectRepository } from "./GetRedirectRepository.js";

export const GetRedirectFeature = createFeature({
    name: "WebsiteBuilder/GetRedirect",
    register(container) {
        container.register(GetRedirectUseCase);
        container.register(GetRedirectRepository).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
