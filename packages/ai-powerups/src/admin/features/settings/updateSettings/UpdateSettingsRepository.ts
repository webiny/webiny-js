import {
    UpdateSettingsRepository as RepositoryAbstraction,
    UpdateSettingsGateway
} from "./abstractions.js";
import { SettingsCache } from "../shared/abstractions.js";

class UpdateSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: SettingsCache.Interface,
        private gateway: UpdateSettingsGateway.Interface
    ) {}

    async execute(data: Record<string, any>): Promise<Record<string, any>> {
        const result = await this.gateway.execute(data);
        this.cache.set(result);
        return result;
    }
}

export const UpdateSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateSettingsRepositoryImpl,
    dependencies: [SettingsCache, UpdateSettingsGateway]
});
