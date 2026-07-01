import {
    UpdateEcommerceSettingsRepository as RepositoryAbstraction,
    UpdateEcommerceSettingsGateway
} from "./abstractions/index.js";
import { settingsCache } from "~/shared/settingsCache.js";
import { SETTINGS_KEY } from "~/features/ecommerce/settings/constants.js";

class UpdateEcommerceSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: UpdateEcommerceSettingsGateway.Interface) {}

    async execute(settings: RepositoryAbstraction.Params): Promise<void> {
        settingsCache.set(SETTINGS_KEY, settings);
        await this.gateway.execute(settings);
    }
}

export const UpdateEcommerceSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateEcommerceSettingsRepositoryImpl,
    dependencies: [UpdateEcommerceSettingsGateway]
});
