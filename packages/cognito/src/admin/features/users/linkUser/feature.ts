import { createFeature } from "@webiny/feature/admin";
import { LinkUserUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { LinkUserUseCase } from "./LinkUserUseCase.js";
import { LinkUserGateway } from "./LinkUserGateway.js";

export const LinkUserFeature = createFeature({
    name: "Cognito/Users/LinkUser",
    register(container) {
        container.register(LinkUserUseCase);
        container.register(LinkUserGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
