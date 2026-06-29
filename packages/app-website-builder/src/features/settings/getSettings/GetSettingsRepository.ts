import {
    GetSettingsRepository as RepositoryAbstraction,
    GetSettingsGateway
} from "./abstractions/index.js";
import { settingsCache } from "~/shared/settingsCache.js";

const SETTINGS_KEY = "WebsiteBuilder/Settings";

class GetSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: GetSettingsGateway.Interface) {}

    async execute(): Promise<RepositoryAbstraction.Result> {
        if (settingsCache.has(SETTINGS_KEY)) {
            return settingsCache.get(SETTINGS_KEY) as RepositoryAbstraction.Result;
        }

        let settings = await this.gateway.execute();

        if (!settings) {
            settings = { previewDomain: "http://localhost:3000" };
        }

        settingsCache.set(SETTINGS_KEY, settings);

        return settings;
    }
}

export const GetSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [GetSettingsGateway]
});
