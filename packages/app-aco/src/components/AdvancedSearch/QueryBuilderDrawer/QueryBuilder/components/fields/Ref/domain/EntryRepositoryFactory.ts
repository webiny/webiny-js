import { ApolloClient } from "apollo-client";
import { EntriesGatewayInterface, EntriesGraphQLGateway } from "../gateways";
import { EntryRepository } from "./EntryRepository";

export class EntryRepositoryFactory {
    private gateway: EntriesGatewayInterface | undefined;
    private cache: Map<string, EntryRepository> = new Map();

    getRepository(client: ApolloClient<any>, modelId: string) {
        if (!this.gateway) {
            this.gateway = new EntriesGraphQLGateway(client);
        }

        const cacheKey = this.getCacheKey(modelId);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new EntryRepository(this.gateway, modelId));
        }

        return this.cache.get(cacheKey) as EntryRepository;
    }

    private getCacheKey(modelId: string) {
        return `${modelId}#${Date.now().toString()}`;
    }
}

export const entryRepositoryFactory = new EntryRepositoryFactory();
