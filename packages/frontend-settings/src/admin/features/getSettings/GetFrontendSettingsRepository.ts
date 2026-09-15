import {
    GetFrontendSettingsRepository as RepositoryAbstraction,
    GetFrontendSettingsGateway
} from "./abstractions.js";
import type { IFrontendSettings } from "~/shared/types.js";
import { CACHE_KEY, settingsCache } from "~/admin/features/settingsCache.js";

class GetFrontendSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: GetFrontendSettingsGateway.Interface) {}

    async execute(): Promise<IFrontendSettings> {
        if (settingsCache.has(CACHE_KEY)) {
            return settingsCache.get(CACHE_KEY) as IFrontendSettings;
        }

        const settings = await this.gateway.execute();
        settingsCache.set(CACHE_KEY, settings);

        return settings;
    }
}

export const GetFrontendSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFrontendSettingsRepositoryImpl,
    dependencies: [GetFrontendSettingsGateway]
});
