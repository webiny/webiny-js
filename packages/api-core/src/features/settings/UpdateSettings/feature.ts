import { createFeature } from "@webiny/feature/api";
import { UpdateSettingsUseCase } from "./UpdateSettingsUseCase.js";

export const UpdateSettingsFeature = createFeature({
    name: "UpdateSettings",
    register(container) {
        container.register(UpdateSettingsUseCase);
    }
});
