import { makeAutoObservable, runInAction } from "mobx";
import {
    ListCapabilitiesRepository as RepoAbstraction,
    ListCapabilitiesGateway
} from "./abstractions.js";
import type { AiCapability } from "./abstractions.js";

class ListCapabilitiesRepositoryImpl implements RepoAbstraction.Interface {
    private capabilities: AiCapability[] = [];

    constructor(private gateway: ListCapabilitiesGateway.Interface) {
        makeAutoObservable(this);
    }

    async execute(): Promise<void> {
        const capabilities = await this.gateway.execute();
        runInAction(() => {
            this.capabilities = capabilities;
        });
    }

    getCapabilities(): AiCapability[] {
        return this.capabilities;
    }
}

export const ListCapabilitiesRepository = RepoAbstraction.createImplementation({
    implementation: ListCapabilitiesRepositoryImpl,
    dependencies: [ListCapabilitiesGateway]
});
