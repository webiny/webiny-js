import type { ApolloClient } from "@apollo/client";
import type { FiltersGatewayInterface } from "~/components/AdvancedSearch/gateways/index.js";
import { FiltersGraphQLGateway } from "~/components/AdvancedSearch/gateways/index.js";
import { FilterRepository } from "./FilterRepository.js";

class FilterRepositoryFactory {
    private gateway: FiltersGatewayInterface | undefined;
    private cache: Map<string, FilterRepository> = new Map();

    getRepository(client: ApolloClient, namespace: string) {
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
