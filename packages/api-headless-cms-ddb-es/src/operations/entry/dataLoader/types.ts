import type { Entity } from "@webiny/db-dynamodb/toolbox.js";

export interface DataLoaderParams {
    entity: Entity<any>;
    tenant: string;
}
