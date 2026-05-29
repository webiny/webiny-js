import { createFeature } from "@webiny/feature/admin";
import { CreateRedirectUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateRedirectUseCase } from "./CreateRedirectUseCase.js";
import { CreateRedirectRepository } from "./CreateRedirectRepository.js";
import { CreateRedirectGateway } from "./CreateRedirectGateway.js";

export const CreateRedirectFeature = createFeature({
    name: "WebsiteBuilder/CreateRedirect",
    register(container) {
        container.register(CreateRedirectUseCase);
        container.register(CreateRedirectRepository).inSingletonScope();
        container.register(CreateRedirectGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
