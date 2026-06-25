import { createFeature } from "@webiny/feature/admin";
import { MoveRedirectUseCase as UseCaseAbstraction } from "./abstractions.js";
import { MoveRedirectUseCase } from "./MoveRedirectUseCase.js";
import { MoveRedirectRepository } from "./MoveRedirectRepository.js";
import { MoveRedirectGateway } from "./MoveRedirectGateway.js";

export const MoveRedirectFeature = createFeature({
    name: "WebsiteBuilder/MoveRedirect",
    register(container) {
        container.register(MoveRedirectUseCase);
        container.register(MoveRedirectRepository).inSingletonScope();
        container.register(MoveRedirectGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
