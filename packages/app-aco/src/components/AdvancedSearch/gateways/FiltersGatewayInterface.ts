import { FilterRaw } from "../domain";
import {
    CreateFilterPayload,
    UpdateFilterPayload
} from "~/components/AdvancedSearch/gateways/filters.types";

export interface FiltersGatewayInterface {
    list: (namespace: string) => Promise<FilterRaw[]>;
    get: (id: string) => Promise<FilterRaw>;
    create: (filter: CreateFilterPayload) => Promise<FilterRaw>;
    update: (filter: UpdateFilterPayload) => Promise<FilterRaw>;
    delete: (id: string) => Promise<boolean>;
}
