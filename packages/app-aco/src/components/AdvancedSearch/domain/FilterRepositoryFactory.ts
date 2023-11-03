import { FiltersGatewayInterface } from "~/components/AdvancedSearch/gateways";
import { FilterRepository } from "./FilterRepository";

export class FilterRepositoryFactory {
    private readonly gateway: FiltersGatewayInterface;
    private repositories: { [key: string]: FilterRepository } = {};

    constructor(gateway: FiltersGatewayInterface) {
        this.gateway = gateway;
    }

    create(namespace: string): FilterRepository {
        if (!this.repositories[namespace]) {
            this.repositories[namespace] = new FilterRepository(this.gateway, namespace);
        }

        return this.repositories[namespace];
    }
}
