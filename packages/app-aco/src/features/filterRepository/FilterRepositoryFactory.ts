import {
    FilterRepositoryFactory as FactoryAbstraction,
    FiltersGateway
} from "./abstractions/index.js";
import { FilterRepository } from "~/components/AdvancedSearch/domain/FilterRepository.js";

class FilterRepositoryFactoryImpl implements FactoryAbstraction.Interface {
    private cache: Map<string, FilterRepository> = new Map();

    constructor(private gateway: FiltersGateway.Interface) {}

    getRepository(namespace: string): FilterRepository {
        if (!this.cache.has(namespace)) {
            this.cache.set(namespace, new FilterRepository(this.gateway, namespace));
        }

        return this.cache.get(namespace) as FilterRepository;
    }
}

export const FilterRepositoryFactory = FactoryAbstraction.createImplementation({
    implementation: FilterRepositoryFactoryImpl,
    dependencies: [FiltersGateway]
});
