import { ApolloClient } from "apollo-client";
import { EntriesGatewayInterface, EntriesGraphQLGateway } from "../adapters";
import { EntryRepository } from "./EntryRepository";

export class EntryRepositoryFactory {
    private gateway: EntriesGatewayInterface | undefined;
    private cache: Map<string, EntryRepository> = new Map();

    getRepository(client: ApolloClient<any>, modelIds: string[]) {
        if (!this.gateway) {
            this.gateway = new EntriesGraphQLGateway(client);
        }

        const cacheKey = this.getCacheKey(modelIds);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new EntryRepository(this.gateway, modelIds));
        }

        return this.cache.get(cacheKey) as EntryRepository;
    }

    private getCacheKey(modelIds: string[]) {
        return [Date.now().toString(), ...modelIds].join("#");
    }
}

export const entryRepositoryFactory = new EntryRepositoryFactory();
