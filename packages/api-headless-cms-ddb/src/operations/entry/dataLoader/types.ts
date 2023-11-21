import { Entity } from "dynamodb-toolbox";

export interface DataLoaderParams {
    entity: Entity<any>;
    tenant: string;
    locale: string;
}
