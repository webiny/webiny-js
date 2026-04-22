import {
    UpdateSettingsRepository as RepositoryAbstraction,
    UpdateSettingsGateway
} from "./abstractions.js";
import { SettingsCache } from "../shared/abstractions.js";
import type { IAiPowerUpsSettings } from "../shared/abstractions.js";

class UpdateSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: SettingsCache.Interface,
        private gateway: UpdateSettingsGateway.Interface
    ) {}

    async execute(data: IAiPowerUpsSettings): Promise<IAiPowerUpsSettings> {
        const result = await this.gateway.execute(data);
        this.cache.set(result);
        return result;
    }
}

export const UpdateSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateSettingsRepositoryImpl,
    dependencies: [SettingsCache, UpdateSettingsGateway]
});
