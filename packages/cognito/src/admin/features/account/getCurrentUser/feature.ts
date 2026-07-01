import { createFeature } from "@webiny/feature/admin";
import { GetCurrentUserUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { GetCurrentUserUseCase } from "./GetCurrentUserUseCase.js";
import { GetCurrentUserGateway } from "./GetCurrentUserGateway.js";

export const GetCurrentUserFeature = createFeature({
    name: "Cognito/GetCurrentUser",
    register(container) {
        container.register(GetCurrentUserUseCase);
        container.register(GetCurrentUserGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
