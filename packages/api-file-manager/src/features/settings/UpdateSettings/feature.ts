import { createFeature } from "@webiny/feature/api";
import { UpdateSettingsUseCase } from "./UpdateSettingsUseCase.js";
import { UpdateSettingsEventsDecorator } from "./UpdateSettingsEventsDecorator.js";

export const UpdateSettingsFeature = createFeature({
    name: "FileManager.UpdateSettings",
    register(container) {
        container.register(UpdateSettingsUseCase);
        // Register the decorator which wraps the use case with events
        container.register(UpdateSettingsEventsDecorator);
    }
});
