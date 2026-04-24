import { createFeature } from "@webiny/feature/admin";
import { LogOutUseCase } from "./LogOutUseCase.js";
import { LogOutUseCase as UseCase } from "./abstractions.js";

export const LogOutFeature = createFeature({
    name: "LogOut",
    register(container) {
        container.register(LogOutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
