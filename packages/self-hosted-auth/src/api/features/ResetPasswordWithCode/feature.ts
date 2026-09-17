import { createFeature } from "@webiny/feature/api";
import { ResetPasswordWithCodeUseCase } from "./ResetPasswordWithCodeUseCase.js";

export const ResetPasswordWithCodeFeature = createFeature({
    name: "ResetPasswordWithCodeFeature",
    register(container) {
        container.register(ResetPasswordWithCodeUseCase);
    }
});
