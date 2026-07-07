import { createFeature } from "@webiny/feature/api";
import { SetPasswordUseCase } from "./SetPasswordUseCase.js";

export const SetPasswordFeature = createFeature({
    name: "SetPasswordFeature",
    register(container) {
        container.register(SetPasswordUseCase);
    }
});
