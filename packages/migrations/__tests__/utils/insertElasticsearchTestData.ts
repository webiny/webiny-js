import { ElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import chunk from "lodash/chunk";

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
