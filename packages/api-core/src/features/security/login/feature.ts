import { createFeature } from "@webiny/feature/api";
import { LogInUseCase } from "./LogInUseCase.js";

export const LogInFeature = createFeature({
    name: "LogIn",
    register(container) {
        container.register(LogInUseCase);
    }
});
