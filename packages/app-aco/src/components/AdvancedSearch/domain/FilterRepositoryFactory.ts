import { ApolloClient } from "apollo-client";
import {
    FiltersGatewayInterface,
    FiltersGraphQLGateway
} from "~/components/AdvancedSearch/gateways";
import { FilterRepository } from "./FilterRepository";

class FilterRepositoryFactory {
    private gateway: FiltersGatewayInterface | undefined;
    private cache: Map<string, FilterRepository> = new Map();

    getRepository(client: ApolloClient<any>, namespace: string) {
        if (!this.gateway) {
            this.gateway = new FiltersGraphQLGateway(client);
        }

        if (!this.cache.has(namespace)) {
            this.cache.set(namespace, new FilterRepository(this.gateway, namespace));
        }

        return this.cache.get(namespace) as FilterRepository;
    }
}

export const filterRepositoryFactory = new FilterRepositoryFactory();
