import { createFeature } from "@webiny/feature/api";
import { UpdateBackgroundTaskSettingsUseCaseImpl } from "./UpdateBackgroundTaskSettingsUseCase.js";
import {
    UpdateBackgroundTaskSettingsUseCase,
    UpdateBackgroundTaskSettingsRepository as RepositoryAbstraction
} from "./abstractions.js";
import { UpdateBackgroundTaskSettingsRepository } from "./UpdateBackgroundTaskSettingsRepository.js";
import type { Context } from "~/api/types.js";

export const UpdateBackgroundTaskSettingsFeature = createFeature<Context>({
    name: "UpdateBackgroundTaskSettings",
    register(container, context) {
        container.register(UpdateBackgroundTaskSettingsRepository).inSingletonScope();

        const repository = container.resolve(RepositoryAbstraction);
        container.registerInstance(
            UpdateBackgroundTaskSettingsUseCase,
            new UpdateBackgroundTaskSettingsUseCaseImpl(context!, repository)
        );
    }
});
