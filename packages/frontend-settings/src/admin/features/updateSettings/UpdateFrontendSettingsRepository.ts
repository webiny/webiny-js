import {
    UpdateFrontendSettingsRepository as RepositoryAbstraction,
    UpdateFrontendSettingsGateway,
    type FrontendSettingsInput
} from "./abstractions.js";
import { CACHE_KEY, settingsCache } from "~/admin/features/settingsCache.js";

class UpdateFrontendSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: UpdateFrontendSettingsGateway.Interface) {}

    async execute(data: FrontendSettingsInput): Promise<boolean> {
        const result = await this.gateway.execute(data);
        settingsCache.delete(CACHE_KEY);
        return result;
    }
}

export const UpdateFrontendSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateFrontendSettingsRepositoryImpl,
    dependencies: [UpdateFrontendSettingsGateway]
});
