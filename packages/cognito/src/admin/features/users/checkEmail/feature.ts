import { createFeature } from "@webiny/feature/admin";
import { CheckEmailUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { CheckEmailUseCase } from "./CheckEmailUseCase.js";
import { CheckEmailGateway } from "./CheckEmailGateway.js";

export const CheckEmailFeature = createFeature({
    name: "Cognito/Users/CheckEmail",
    register(container) {
        container.register(CheckEmailUseCase);
        container.register(CheckEmailGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
