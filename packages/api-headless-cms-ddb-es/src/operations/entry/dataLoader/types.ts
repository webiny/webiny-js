import { Entity } from "@webiny/db-dynamodb/toolbox";

export interface DataLoaderParams {
    entity: Entity<any>;
    tenant: string;
    locale: string;
}
