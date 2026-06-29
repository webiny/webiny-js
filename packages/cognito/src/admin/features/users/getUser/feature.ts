import { createFeature } from "@webiny/feature/admin";
import { GetUserUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { GetUserUseCase } from "./GetUserUseCase.js";
import { GetUserGateway } from "./GetUserGateway.js";

export const GetUserFeature = createFeature({
    name: "Cognito/Users/GetUser",
    register(container) {
        container.register(GetUserUseCase);
        container.register(GetUserGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
