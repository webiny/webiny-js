import { makeAutoObservable, runInAction } from "mobx";
import {
    NextjsConfigRepository as RepositoryAbstraction,
    NextjsConfigGateway,
    NextjsConfig,
    StarterKitFramework
} from "./abstractions.js";

class NextjsConfigRepositoryImpl implements RepositoryAbstraction.Interface {
    private configs: Map<StarterKitFramework, NextjsConfig> = new Map();

    constructor(private gateway: NextjsConfigGateway.Interface) {
        makeAutoObservable(this);
    }

    getConfig(framework: StarterKitFramework): NextjsConfig | undefined {
        return this.configs.get(framework);
    }

    async loadConfig(framework: StarterKitFramework): Promise<void> {
        if (this.configs.has(framework)) {
            return;
        }

        try {
            const config = await this.gateway.getConfig(framework);
            runInAction(() => {
                this.configs.set(framework, config);
            });
        } catch {
            // Ignore errors for now.
        }
    }
}

export const NextjsConfigRepository = RepositoryAbstraction.createImplementation({
    implementation: NextjsConfigRepositoryImpl,
    dependencies: [NextjsConfigGateway]
});
