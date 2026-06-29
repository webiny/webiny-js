import {
    GetEcommerceSettingsRepository as RepositoryAbstraction,
    GetEcommerceSettingsGateway
} from "./abstractions/index.js";
import { settingsCache } from "~/shared/settingsCache.js";
import { SETTINGS_KEY } from "~/features/ecommerce/settings/constants.js";

class GetEcommerceSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: GetEcommerceSettingsGateway.Interface) {}

    async execute(): Promise<RepositoryAbstraction.Result> {
        if (settingsCache.has(SETTINGS_KEY)) {
            return settingsCache.get(SETTINGS_KEY) as RepositoryAbstraction.Result;
        }

        let settings = await this.gateway.execute();
        if (!settings) {
            settings = {};
        }

        settingsCache.set(SETTINGS_KEY, settings);

        return settings;
    }
}

export const GetEcommerceSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetEcommerceSettingsRepositoryImpl,
    dependencies: [GetEcommerceSettingsGateway]
});
