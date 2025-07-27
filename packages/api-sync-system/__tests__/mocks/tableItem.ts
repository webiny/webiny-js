import type { ITable } from "~/sync/types.js";
import type { IStoreItem } from "~/resolver/app/storer/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { PutCommand } from "@webiny/aws-sdk/client-dynamodb";
import { faker } from "@faker-js/faker";

export interface IStoreMockTableItem {
    client: DynamoDBDocument;
    table: Pick<ITable, "name">;
    item: IStoreItem;
}

export const storeMockTableItem = async (params: IStoreMockTableItem) => {
    const { client, table, item } = params;
    const cmd = new PutCommand({
        TableName: table.name,
        Item: {
            ...item
        }
    });

    await client.send(cmd);
};

export interface IStoreMockTableItems {
    client: DynamoDBDocument;
    table: Pick<ITable, "name">;
    items: IStoreItem[];
}

export const storeMockTableItems = (params: IStoreMockTableItems) => {
    const { client, table, items } = params;
    return Promise.all(
        items.map(item => {
            return storeMockTableItem({
                client,
                table,
                item
            });
        })
    );
};

export interface ICreateMockTableItemDataParams {
    order: number;
    size?: "extreme";
}

export const createMockTableItemData = (params: ICreateMockTableItemDataParams) => {
    const { order, size } = params;
    return Object.freeze({
        PK: `T#${order}`,
        SK: `T#${order}`,
        GSI1PK: `GSI#${order}`,
        GSI1SK: `GSI#${order}`,
        values: {
            name: `Item ${order}`,
            description:
                size === "extreme"
                    ? faker.string.sample({
                          min: 307200,
                          max: 358400
                      })
                    : null
        }
    });
};
