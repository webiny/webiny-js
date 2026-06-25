import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { ITenantEntity } from "~/tenancy/definitions/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

interface Params {
    entityName: string;
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
}
export const createTenantEntity = ({
    entityName,
    client,
    entityFactory
}: Params): ITenantEntity => {
    return entityFactory.createStandard<Tenant>({
        name: entityName,
        client
    });
};
