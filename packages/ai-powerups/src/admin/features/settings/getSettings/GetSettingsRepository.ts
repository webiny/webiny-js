import {
    GetSettingsRepository as RepositoryAbstraction,
    GetSettingsGateway
} from "./abstractions.js";
import { SettingsCache } from "../shared/abstractions.js";

class GetSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: SettingsCache.Interface,
        private gateway: GetSettingsGateway.Interface
    ) {}

    async execute(): Promise<Record<string, any>> {
        const cached = this.cache.get();
        if (cached) {
            return cached;
        }

        const data = await this.gateway.execute();
        this.cache.set(data);
        return data;
    }
}

export const GetSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [SettingsCache, GetSettingsGateway]
});
