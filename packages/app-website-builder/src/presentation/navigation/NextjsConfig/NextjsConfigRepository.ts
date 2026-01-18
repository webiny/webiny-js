import { makeAutoObservable, runInAction } from "mobx";
import {
    NextjsConfigRepository as RepositoryAbstraction,
    NextjsConfigGateway,
    NextjsConfig
} from "./abstractions.js";

class NextjsConfigRepositoryImpl implements RepositoryAbstraction.Interface {
    private config: NextjsConfig | undefined = undefined;

    constructor(private gateway: NextjsConfigGateway.Interface) {
        makeAutoObservable(this);
    }

    getConfig(): NextjsConfig | undefined {
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

export const NextjsConfigRepository = RepositoryAbstraction.createImplementation({
    implementation: NextjsConfigRepositoryImpl,
    dependencies: [NextjsConfigGateway]
});
