import { createFeature } from "@webiny/feature/admin";
import { GetBackgroundTaskSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetBackgroundTaskSettingsUseCase } from "./GetBackgroundTaskSettingsUseCase.js";
import { GetBackgroundTaskSettingsGateway } from "./GetBackgroundTaskSettingsGateway.js";

export const GetBackgroundTaskSettingsFeature = createFeature({
    name: "BackgroundTasks/GetBackgroundTaskSettings",
    register(container) {
        container.register(GetBackgroundTaskSettingsUseCase);
        container.register(GetBackgroundTaskSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
