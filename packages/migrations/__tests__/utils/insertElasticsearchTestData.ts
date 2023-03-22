import { Client } from "@elastic/elasticsearch";

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

    await elasticsearch.bulk({
        body: operations
    });
};
