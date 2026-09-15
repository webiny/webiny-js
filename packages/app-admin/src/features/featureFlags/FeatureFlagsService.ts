import { makeAutoObservable, runInAction } from "mobx";
import { createImplementation } from "@webiny/di";
import { LocalStorage } from "@webiny/app/features/localStorage";
import { FeatureFlags } from "@webiny/feature-flags";
import type { IFeatureFlagsDto } from "@webiny/feature-flags";
import { FeatureFlagsService as Abstraction, FeatureFlagsGateway } from "./abstractions.js";

const LOCAL_STORAGE_KEY = "featureFlags";

class FeatureFlagsServiceImpl implements Abstraction.Interface {
    private flags: FeatureFlags = new FeatureFlags({});
    private loaded = false;

    constructor(
        private gateway: FeatureFlagsGateway.Interface,
        private localStorage: LocalStorage.Interface
    ) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.initializeFromLocalStorage();
    }

    private initializeFromLocalStorage(): void {
        try {
            const cached = this.localStorage.get<IFeatureFlagsDto>(LOCAL_STORAGE_KEY);
            if (cached) {
                this.flags = FeatureFlags.fromDto(cached);
                this.loaded = true;
            }
        } catch (error) {
            console.warn("Failed to load feature flags from localStorage:", error);
        }

        this.loadFlags();
    }

    getFlags(): FeatureFlags {
        return this.flags;
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    async loadFlags(): Promise<void> {
        try {
            const data = await this.gateway.fetchFlags();
            const dto = data ?? {};
            const flags = FeatureFlags.fromDto(dto);

            runInAction(() => {
                this.flags = flags;
                this.loaded = true;
            });

            this.localStorage.set(LOCAL_STORAGE_KEY, dto);
        } catch (error) {
            console.error("Failed to load feature flags:", error);
            runInAction(() => {
                this.loaded = true;
            });
        }
    }
}

export const FeatureFlagsService = createImplementation({
    abstraction: Abstraction,
    implementation: FeatureFlagsServiceImpl,
    dependencies: [FeatureFlagsGateway, LocalStorage]
});
