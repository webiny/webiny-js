import { createFeature } from "@webiny/feature/api";
import { ResetUserMfaUseCase } from "./ResetUserMfaUseCase.js";

export const ResetUserMfaFeature = createFeature({
    name: "ResetUserMfaFeature",
    register(container) {
        container.register(ResetUserMfaUseCase);
    }
});
