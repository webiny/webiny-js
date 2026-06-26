import type { MailerSettings, TransportSettings } from "~/types.js";
import { SaveSettingsUseCase as UseCaseAbstraction, SaveSettingsGateway } from "./abstractions.js";
import { GetSettingsRepository } from "~/features/getSettings/abstractions.js";

class SaveSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private gateway: SaveSettingsGateway.Interface,
        private settingsRepository: GetSettingsRepository.Interface
    ) {}

    async execute(data: TransportSettings): Promise<MailerSettings> {
        const result = await this.gateway.execute(data);
        this.settingsRepository.updateSettings(result);
        return result;
    }
}

export const SaveSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: SaveSettingsUseCaseImpl,
    dependencies: [SaveSettingsGateway, GetSettingsRepository]
});
