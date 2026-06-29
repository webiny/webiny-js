import { createFeature } from "@webiny/feature/admin";
import { UpdateUserUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { UpdateUserUseCase } from "./UpdateUserUseCase.js";
import { UpdateUserGateway } from "./UpdateUserGateway.js";

export const UpdateUserFeature = createFeature({
    name: "Cognito/Users/UpdateUser",
    register(container) {
        container.register(UpdateUserUseCase);
        container.register(UpdateUserGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
