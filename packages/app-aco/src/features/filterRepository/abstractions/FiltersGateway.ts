import { createAbstraction } from "@webiny/feature/admin";
import type { FilterDTO } from "~/components/AdvancedSearch/domain/index.js";
import type {
    CreateFilterPayload,
    UpdateFilterPayload
} from "~/components/AdvancedSearch/gateways/filters.types.js";

export interface IFiltersGateway {
    list(namespace: string): Promise<FilterDTO[]>;
    get(id: string): Promise<FilterDTO>;
    create(filter: CreateFilterPayload): Promise<FilterDTO>;
    update(filter: UpdateFilterPayload): Promise<FilterDTO>;
    delete(id: string): Promise<boolean>;
}

export const FiltersGateway = createAbstraction<IFiltersGateway>("Aco/FiltersGateway");

export namespace FiltersGateway {
    export type Interface = IFiltersGateway;
}
