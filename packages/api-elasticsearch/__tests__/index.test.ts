import { base } from "~/indexConfiguration/base";
import { japanese } from "~/indexConfiguration/japanese";
import { ElasticsearchIndexRequestBody } from "~/types";
import { createElasticsearchClient, createPrefixId } from "./helpers";
import { deleteIndexes } from "@webiny/project-utils/testing/elasticsearch/indices";

/**
 * Add configurations when added to the code.
 */
const settings: [string, ElasticsearchIndexRequestBody][] = [
    ["base", base],
    ["japanese", japanese]
];

describe("Elasticsearch Index Mapping And Settings", () => {
    const client = createElasticsearchClient();

    let prefix: string = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";
    if (!prefix) {
        prefix = createPrefixId(10);
        process.env.ELASTIC_SEARCH_INDEX_PREFIX = prefix;
    }

    const testIndexName = `${prefix}dummy-index-test`;

    beforeEach(async () => {
        await deleteIndexes({
            client,
            prefix
        });
    });

    afterEach(async () => {
        await deleteIndexes({
            client,
            prefix
        });
    });

    it.each(settings)(
        "should create index with correct settings - %s",
        async (_: string, setting: ElasticsearchIndexRequestBody) => {
            const createResponse = await client.indices.create({
                index: testIndexName,
                body: {
                    ...setting
                }
            });

            expect(createResponse).toMatchObject({
                body: {
                    acknowledged: true,
                    index: testIndexName
                },
                statusCode: 200
            });

            const mappingResponse = await client.indices.getMapping({
                index: testIndexName
            });

            expect(mappingResponse.body).toEqual({
                [testIndexName]: {
                    mappings: {
                        ...setting.mappings
                    }
                }
            });

            const settingsResponse = await client.indices.getSettings({
                index: testIndexName
            });

            expect(settingsResponse.body).toEqual({
                [testIndexName]: {
                    settings: {
                        ...setting.settings,
                        index: {
                            ...(setting.settings?.index || {}),
                            creation_date: expect.stringMatching(/^([0-9]+)$/),
                            number_of_replicas: expect.stringMatching(/^([0-9]+)$/),
                            number_of_shards: expect.stringMatching(/^([0-9]+)$/),
                            provided_name: testIndexName,
                            uuid: expect.stringMatching(/^([a-zA-Z0-9_-]+)$/),
                            version: {
                                created: expect.stringMatching(/^([0-9]+)$/)
                            }
                        }
                    }
                }
            });
        }
    );
});
