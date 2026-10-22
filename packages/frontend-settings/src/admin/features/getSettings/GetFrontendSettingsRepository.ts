import {
    GetFrontendSettingsRepository as RepositoryAbstraction,
    GetFrontendSettingsGateway
} from "./abstractions.js";
import type { IFrontendSettings } from "~/shared/types.js";
import { CACHE_KEY, settingsCache } from "~/admin/features/settingsCache.js";

class GetFrontendSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    private pending: Promise<IFrontendSettings> | null = null;

    constructor(private gateway: GetFrontendSettingsGateway.Interface) {}

    async execute(): Promise<IFrontendSettings> {
        if (settingsCache.has(CACHE_KEY)) {
            return settingsCache.get(CACHE_KEY) as IFrontendSettings;
        }

        // Every preview consumer asks for the settings on mount; share one request between them.
        if (!this.pending) {
            this.pending = this.gateway
                .execute()
                .then(settings => {
                    settingsCache.set(CACHE_KEY, settings);
                    return settings;
                })
                .finally(() => {
                    this.pending = null;
                });
        }

        return this.pending;
    }
}

export const GetFrontendSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFrontendSettingsRepositoryImpl,
    dependencies: [GetFrontendSettingsGateway]
});
