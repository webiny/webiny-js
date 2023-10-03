import { QueryObjectRaw } from "~/components/AdvancedSearch/QueryObject";

export interface BaseGateway {
    list: (modelId: string) => Promise<QueryObjectRaw[]>;
    create: (
        filter: Omit<QueryObjectRaw, "id" | "createdOn" | "createdBy" | "savedOn">
    ) => Promise<QueryObjectRaw>;
    update: (
        filter: Omit<QueryObjectRaw, "createdOn" | "createdBy" | "savedOn">
    ) => Promise<QueryObjectRaw>;
    delete: (id: string) => Promise<boolean>;
}
