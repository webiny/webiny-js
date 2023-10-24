import { FilterRaw } from "../domain";

export interface FiltersGatewayInterface {
    list: (namespace: string) => Promise<FilterRaw[]>;
    get: (id: string) => Promise<FilterRaw>;
    create: (filter: Omit<FilterRaw, "createdOn" | "createdBy" | "savedOn">) => Promise<FilterRaw>;
    update: (filter: Omit<FilterRaw, "createdOn" | "createdBy" | "savedOn">) => Promise<FilterRaw>;
    delete: (id: string) => Promise<boolean>;
}
