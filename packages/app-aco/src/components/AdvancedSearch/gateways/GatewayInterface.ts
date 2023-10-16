import { FilterRaw } from "../domain";

export interface GatewayInterface {
    list: (modelId: string) => Promise<FilterRaw[]>;
    get: (id: string) => Promise<FilterRaw>;
    create: (filter: Omit<FilterRaw, "createdOn" | "createdBy" | "savedOn">) => Promise<FilterRaw>;
    update: (filter: Omit<FilterRaw, "createdOn" | "createdBy" | "savedOn">) => Promise<FilterRaw>;
    delete: (id: string) => Promise<boolean>;
}
