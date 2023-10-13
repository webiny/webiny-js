import { QueryObjectRaw } from "~/components/AdvancedSearch/QueryObject";

export interface GatewayInterface {
    list: (modelId: string) => Promise<QueryObjectRaw[]>;
    get: (id: string) => Promise<QueryObjectRaw>;
    create: (
        filter: Omit<QueryObjectRaw, "createdOn" | "createdBy" | "savedOn">
    ) => Promise<QueryObjectRaw>;
    update: (
        filter: Omit<QueryObjectRaw, "createdOn" | "createdBy" | "savedOn">
    ) => Promise<QueryObjectRaw>;
    delete: (id: string) => Promise<boolean>;
}
