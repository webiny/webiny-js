import { createFeature } from "@webiny/feature/api";
import { StoreFileUseCase } from "./StoreFileUseCase.js";

export const StoreFileFeature = createFeature({
    name: "FileManager/StoreFile",
    register(container) {
        container.register(StoreFileUseCase);
    }
});
