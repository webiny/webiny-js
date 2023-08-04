import chunk from "lodash/chunk";
import { ElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { Table } from "dynamodb-toolbox";
import { scanTable } from "~tests/utils/scanTable";
import { getDecompressedData } from "~tests/migrations/5.37.0/003/ddb-es/getDecompressedData";

export const transferDynamoDbToElasticsearch = async <
    TItem extends Record<string, any> = Record<string, any>
>(
    elasticsearch: ElasticsearchClient,
    table: Table,
    getIndexName: (item: TItem) => string
) => {
    const records: TItem[] = await Promise.all(
        (
            await scanTable(table)
        ).map(async record => {
            const result = await getDecompressedData(record.data);

            return {
                ...result,
                PK: record.PK,
                SK: record.SK
            };
        })
    );

    if (!records?.length) {
        return;
    }
    const operations = [];

    for (const record of records) {
        const index = getIndexName(record);

        const id = record.PK && record.SK ? `${record.PK}:${record.SK}` : record.id;
        operations.push(
            {
                index: {
                    _id: id,
                    _index: index
                }
            },
            record
        );
        elasticsearch.indices.registerIndex(index);
    }

    const chunkedItems: any[][] = chunk(operations, 3000);
    for (const items of chunkedItems) {
        const result = await elasticsearch.bulk({
            body: items
        });
        if (!result.body.errors) {
            continue;
        }
        console.log(JSON.stringify(result.body.items, null, 2));
        throw new Error("Error while inserting data into Elasticsearch.");
    }
    await elasticsearch.indices.refreshAll();
    return records;
};

export const insertElasticsearchTestData = async <
    TItem extends Record<string, any> = Record<string, any>
>(
    elasticsearch: ElasticsearchClient,
    data: TItem[],
    getIndexName: (item: TItem) => string
) => {
    const operations = [];

    for (const record of data) {
        const index = getIndexName(record);
        operations.push({ index: { _id: record["id"], _index: index } }, record);
        elasticsearch.indices.registerIndex(index);
    }

    const chunkedItems: any[][] = chunk(operations, 3000);
    for (const items of chunkedItems) {
        await elasticsearch.bulk({
            body: items
        });
    }
};
