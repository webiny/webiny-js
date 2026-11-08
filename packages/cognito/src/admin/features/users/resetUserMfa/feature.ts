import { createFeature } from "@webiny/feature/admin";
import { ResetUserMfaUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { ResetUserMfaUseCase } from "./ResetUserMfaUseCase.js";
import { ResetUserMfaGateway } from "./ResetUserMfaGateway.js";

export const ResetUserMfaFeature = createFeature({
    name: "Cognito/Users/ResetUserMfa",
    register(container) {
        container.register(ResetUserMfaUseCase);
        container.register(ResetUserMfaGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
