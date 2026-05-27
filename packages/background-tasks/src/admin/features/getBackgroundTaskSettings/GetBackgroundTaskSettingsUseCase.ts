import type { BackgroundTaskSettings } from "~/admin/shared/types.js";
import {
    GetBackgroundTaskSettingsUseCase as UseCaseAbstraction,
    GetBackgroundTaskSettingsGateway
} from "./abstractions.js";

class GetBackgroundTaskSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: GetBackgroundTaskSettingsGateway.Interface) {}

    async execute(): Promise<BackgroundTaskSettings> {
        return this.gateway.execute();
    }
}

export const GetBackgroundTaskSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetBackgroundTaskSettingsUseCaseImpl,
    dependencies: [GetBackgroundTaskSettingsGateway]
});
