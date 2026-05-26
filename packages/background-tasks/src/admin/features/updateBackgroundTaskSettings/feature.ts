import { createFeature } from "@webiny/feature/admin";
import { UpdateBackgroundTaskSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateBackgroundTaskSettingsUseCase } from "./UpdateBackgroundTaskSettingsUseCase.js";
import { UpdateBackgroundTaskSettingsGateway } from "./UpdateBackgroundTaskSettingsGateway.js";

export const UpdateBackgroundTaskSettingsFeature = createFeature({
    name: "BackgroundTasks/UpdateBackgroundTaskSettings",
    register(container) {
        container.register(UpdateBackgroundTaskSettingsUseCase);
        container.register(UpdateBackgroundTaskSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
