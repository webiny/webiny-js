import { createFeature } from "@webiny/feature/admin";
import { CreateUserUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { CreateUserUseCase } from "./CreateUserUseCase.js";
import { CreateUserGateway } from "./CreateUserGateway.js";

export const CreateUserFeature = createFeature({
    name: "Cognito/Users/CreateUser",
    register(container) {
        container.register(CreateUserUseCase);
        container.register(CreateUserGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
