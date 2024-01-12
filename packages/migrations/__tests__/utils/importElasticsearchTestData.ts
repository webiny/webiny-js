import chunk from "lodash/chunk";
import { ElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";

/**
 * Takes an array of raw Elasticsearch records and imports them into Elasticsearch.
 * Example of a raw Elasticsearch record:
 * {
 *     _index: "root-headless-cms-en-us-acosearchrecord-pbpage",
 *     _id: "T#root#L#en-US#CMS#CME#wby-aco-658c1bd3c39bb10008431b5b:L",
 *     _source: {
 *         modelId: "acoSearchRecord-pbpage",
 *         version: 1,
 *         location: {
 *             folderId: "root"
 *         },
 *         TYPE: "cms.entry.l",
 *         __type: "cms.entry.l"
 *         (...) // Other properties
 *     }
 * }
 */

interface RawElasticsearchRecord {
    _index: string;
    _type: string;
    _id: string;
    _score: number;
    _source: Record<string, any>;
}

export const importElasticsearchTestData = async (
    elasticsearch: ElasticsearchClient,
    data: RawElasticsearchRecord[]
) => {
    const operations = [];

    for (const record of data) {
        const { _id, _index, _source } = record;
        operations.push({ index: { _id, _index } }, _source);
        elasticsearch.indices.registerIndex(_index);
    }

    const chunkedItems: any[][] = chunk(operations, 3000);
    for (const items of chunkedItems) {
        await elasticsearch.bulk({
            body: items
        });
    }
};
