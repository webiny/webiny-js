import { createFeature } from "@webiny/feature/admin";
import { LogInUseCase as UseCase } from "./abstractions.js";
import { LogInUseCase } from "./LogInUseCase.js";
import { IdentityMapper } from "./IdentityMapper.js";
import { LogInGateway } from "./LogInGateway.js";
import { LogInRepository } from "./LogInRepository.js";
import { LoginFieldSelectionComposite } from "./LoginFieldSelectionComposite.js";

export const LogInFeature = createFeature({
    name: "LogIn",
    register(container) {
        container.register(LogInUseCase);
        container.register(IdentityMapper).inSingletonScope();
        container.register(LogInGateway).inSingletonScope();
        container.register(LogInRepository).inSingletonScope();
        container.registerComposite(LoginFieldSelectionComposite);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
