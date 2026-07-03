import {
    UpdateSettingsRepository as RepositoryAbstraction,
    UpdateSettingsGateway
} from "./abstractions/index.js";
import { settingsCache } from "~/shared/settingsCache.js";

const SETTINGS_KEY = "WebsiteBuilder/Settings";

class UpdateSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: UpdateSettingsGateway.Interface) {}

    async execute(settings: RepositoryAbstraction.Params): Promise<void> {
        settingsCache.set(SETTINGS_KEY, settings);
        await this.gateway.execute(settings);
    }
}

export const UpdateSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateSettingsRepositoryImpl,
    dependencies: [UpdateSettingsGateway]
});
