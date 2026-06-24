import type { TableDef } from "@webiny/db-dynamodb/toolbox.js";
import type { IScanParams } from "@webiny/db-dynamodb/utils/DynamoDocClient.js";

export const scanTable = async (table: TableDef, options?: IScanParams) => {
    const items: any[] = [];
    let result = await table.scan(options);
    items.push(...result.items);

    while (result.next) {
        result = await result.next();
        items.push(...result.items);
    }

    return items;
};
