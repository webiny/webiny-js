import { createAbstraction } from "@webiny/feature/admin";
import type { FilterRepository } from "~/components/AdvancedSearch/domain/FilterRepository.js";

export interface IFilterRepositoryFactory {
    getRepository(namespace: string): FilterRepository;
}

export const FilterRepositoryFactory = createAbstraction<IFilterRepositoryFactory>(
    "Aco/FilterRepositoryFactory"
);

export namespace FilterRepositoryFactory {
    export type Interface = IFilterRepositoryFactory;
}
