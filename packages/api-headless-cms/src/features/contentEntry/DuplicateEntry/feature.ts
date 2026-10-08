import { createFeature } from "@webiny/feature/api";
import { DuplicateEntryUseCase } from "./DuplicateEntryUseCase.js";

export const DuplicateEntryFeature = createFeature({
    name: "DuplicateEntry",
    register(container) {
        container.register(DuplicateEntryUseCase);
    }
});
