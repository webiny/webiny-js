import chunk from "lodash/chunk";
import { ElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { scanTable } from "~tests/utils/scanTable";
import { getDecompressedData } from "~tests/migrations/5.37.0/003/ddb-es/getDecompressedData";
import { esPutIndexSettings } from "~/utils";

export const transferDynamoDbToElasticsearch = async <
    TItem extends Record<string, any> = Record<string, any>
>(
    elasticsearch: ElasticsearchClient,
    table: Table<string, string, string>,
    getIndexName: (item: TItem) => string
) => {
    const records: TItem[] = await Promise.all(
        (
            await scanTable(table)
        ).map(async record => {
            const result = await getDecompressedData(record.data);

            return {
                ...result,
                PK: record.PK || result.PK,
                SK: record.SK || result.SK
            };
        })
    );

    if (!records?.length) {
        return;
    }
    const operations = [];

    const indexes = new Set<string>();

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
        indexes.add(index);
        elasticsearch.indices.registerIndex(index);
    }

    for (const index of indexes) {
        const response = await elasticsearch.indices.exists({
            index
        });

        if (response.body) {
            continue;
        }
        await elasticsearch.indices.create({
            index,
            body: {
                settings: {
                    refresh_interval: -1,
                    number_of_replicas: 0,
                    max_result_window: 10000000
                }
            }
        });
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
    for (const index of indexes) {
        await esPutIndexSettings({
            elasticsearchClient: elasticsearch,
            index,
            settings: {
                refresh_interval: "1s",
                number_of_replicas: 1
            }
        });
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
        const id = record.PK && record.SK ? `${record.PK}:${record.SK}` : record.id;
        operations.push({ index: { _id: id, _index: index } }, record);
        elasticsearch.indices.registerIndex(index);
    }

    const chunkedItems: any[][] = chunk(operations, 3000);
    for (const items of chunkedItems) {
        await elasticsearch.bulk({
            body: items
        });
    }
};
