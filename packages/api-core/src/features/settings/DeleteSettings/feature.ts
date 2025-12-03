import { createFeature } from "@webiny/feature/api";
import { DeleteSettingsUseCase } from "./DeleteSettingsUseCase.js";

export const DeleteSettingsFeature = createFeature({
    name: "DeleteSettings",
    register(container) {
        container.register(DeleteSettingsUseCase);
    }
});
