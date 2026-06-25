import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IScanParams } from "@webiny/db-dynamodb/exports/api/db.js";

export const scanTable = async (table: DynamoDbDocumentClient.Interface, options?: IScanParams) => {
    const items: any[] = [];
    let result = await table.scan(options);
    items.push(...result.items);

    while (result.next) {
        result = await result.next();
        items.push(...result.items);
    }

    return items;
};
