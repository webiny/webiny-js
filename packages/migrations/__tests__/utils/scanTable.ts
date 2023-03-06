import { Table } from "dynamodb-toolbox";

type ScanTableOptions = Parameters<Table["scan"]>[0];

export const scanTable = async (table: Table, options?: ScanTableOptions) => {
    const items = [];
    let result = await table.scan(options);
    items.push(...result.Items);

    while (result.next) {
        result = await result.next();
        items.push(...result.Items);
    }

    return items;
};
