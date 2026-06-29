import { createFeature } from "@webiny/feature/admin";
import { UpdateCurrentUserUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { UpdateCurrentUserUseCase } from "./UpdateCurrentUserUseCase.js";
import { UpdateCurrentUserGateway } from "./UpdateCurrentUserGateway.js";

export const UpdateCurrentUserFeature = createFeature({
    name: "Cognito/UpdateCurrentUser",
    register(container) {
        container.register(UpdateCurrentUserUseCase);
        container.register(UpdateCurrentUserGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
