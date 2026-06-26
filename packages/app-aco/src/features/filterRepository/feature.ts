import { createFeature } from "@webiny/feature/admin";
import { FilterRepositoryFactory as FactoryAbstraction } from "./abstractions/index.js";
import { FiltersGateway } from "./FiltersGateway.js";
import { FilterRepositoryFactory } from "./FilterRepositoryFactory.js";

export const FilterRepositoryFeature = createFeature({
    name: "Aco/FilterRepository",
    register(container) {
        container.register(FiltersGateway).inSingletonScope();
        container.register(FilterRepositoryFactory).inSingletonScope();
    },
    resolve(container) {
        return {
            factory: container.resolve(FactoryAbstraction)
        };
    }
});
