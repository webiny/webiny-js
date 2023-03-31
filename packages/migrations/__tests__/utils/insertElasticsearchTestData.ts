import { Client } from "@elastic/elasticsearch";
import chunk from "lodash/chunk";

export const insertElasticsearchTestData = async <
    TItem extends Record<string, any> = Record<string, any>
>(
    elasticsearch: Client,
    data: TItem[],
    getIndexName: (item: TItem) => string
) => {
    const operations = [];

    for (const record of data) {
        operations.push({ index: { _id: record["id"], _index: getIndexName(record) } }, record);
    }

    const chunkedItems: any[][] = chunk(operations, 3000);
    for (const items of chunkedItems) {
        await elasticsearch.bulk({
            body: items
        });
    }
};
