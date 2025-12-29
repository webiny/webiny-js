import { createFeature } from "@webiny/feature/admin";
import { LogInUseCase } from "./LogInUseCase.js";
import { LogInUseCase as UseCase } from "./abstractions.js";

export const LogInFeature = createFeature({
    name: "LogIn",
    register(container) {
        container.register(LogInUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
