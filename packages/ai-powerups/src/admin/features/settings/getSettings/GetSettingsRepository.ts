import {
    GetSettingsRepository as RepositoryAbstraction,
    GetSettingsGateway
} from "./abstractions.js";
import { SettingsCache } from "../shared/abstractions.js";
import type { IAiPowerUpsSettings } from "../shared/abstractions.js";

class GetSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    private pending: Promise<IAiPowerUpsSettings> | null = null;

    constructor(
        private cache: SettingsCache.Interface,
        private gateway: GetSettingsGateway.Interface
    ) {}

    async execute(): Promise<IAiPowerUpsSettings> {
        const cached = this.cache.get();
        if (cached) {
            return cached;
        }

        if (this.pending) {
            return this.pending;
        }

        this.pending = this.gateway
            .execute()
            .then(data => {
                this.cache.set(data);
                return data;
            })
            .finally(() => {
                this.pending = null;
            });

        return this.pending;
    }
}

export const GetSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetSettingsRepositoryImpl,
    dependencies: [SettingsCache, GetSettingsGateway]
});
