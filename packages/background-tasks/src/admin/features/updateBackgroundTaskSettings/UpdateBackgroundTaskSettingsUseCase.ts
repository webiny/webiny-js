import type { BackgroundTaskSettings } from "~/admin/shared/types.js";
import {
    UpdateBackgroundTaskSettingsUseCase as UseCaseAbstraction,
    UpdateBackgroundTaskSettingsGateway,
    type UpdateBackgroundTaskSettingsInput
} from "./abstractions.js";

class UpdateBackgroundTaskSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: UpdateBackgroundTaskSettingsGateway.Interface) {}

    async execute(input: UpdateBackgroundTaskSettingsInput): Promise<BackgroundTaskSettings> {
        return this.gateway.execute(input);
    }
}

export const UpdateBackgroundTaskSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateBackgroundTaskSettingsUseCaseImpl,
    dependencies: [UpdateBackgroundTaskSettingsGateway]
});
