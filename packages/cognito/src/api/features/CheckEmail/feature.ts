import { createFeature } from "@webiny/feature/api";
import { CheckEmailUseCase } from "./CheckEmailUseCase.js";

export const CheckEmailFeature = createFeature({
    name: "CheckEmailFeature",
    register(container) {
        container.register(CheckEmailUseCase);
    }
});
