import { makeAutoObservable, runInAction } from "mobx";
import {
    NuxtConfigRepository as RepositoryAbstraction,
    NuxtConfigGateway,
    NuxtConfig
} from "./abstractions.js";

class NuxtConfigRepositoryImpl implements RepositoryAbstraction.Interface {
    private config: NuxtConfig | undefined = undefined;

    constructor(private gateway: NuxtConfigGateway.Interface) {
        makeAutoObservable(this);
    }

    getConfig(): NuxtConfig | undefined {
        return this.config;
    }

    async loadConfig(): Promise<void> {
        if (this.config) {
            return;
        }

        try {
            const config = await this.gateway.getConfig();
            runInAction(() => {
                this.config = config;
            });
        } catch {
            // Ignore errors for now.
        }
    }
}

export const NuxtConfigRepository = RepositoryAbstraction.createImplementation({
    implementation: NuxtConfigRepositoryImpl,
    dependencies: [NuxtConfigGateway]
});
