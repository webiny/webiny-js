import { createFeature } from "@webiny/feature/api";
import { ValidateEntryUseCase } from "./ValidateEntryUseCase.js";

export const ValidateEntryFeature = createFeature({
    name: "ValidateEntry",
    register(container) {
        // Register use case (transient scope)
        container.register(ValidateEntryUseCase);
    }
});
