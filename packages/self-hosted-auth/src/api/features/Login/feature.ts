import { createFeature } from "@webiny/feature/api";
import { LoginUseCase } from "./LoginUseCase.js";

export const LoginFeature = createFeature({
    name: "LoginFeature",
    register(container) {
        container.register(LoginUseCase);
    }
});
