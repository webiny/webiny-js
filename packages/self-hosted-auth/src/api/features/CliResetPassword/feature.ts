import { createFeature } from "@webiny/feature/api";
import { CliResetPasswordUseCase } from "./CliResetPasswordUseCase.js";

export const CliResetPasswordFeature = createFeature({
    name: "CliResetPasswordFeature",
    register(container) {
        container.register(CliResetPasswordUseCase);
    }
});
