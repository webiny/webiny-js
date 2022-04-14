import { Client } from "@elastic/elasticsearch";
import { base } from "~/indexConfiguration/base";
import { japanese } from "~/indexConfiguration/japanese";
import { ElasticsearchIndexRequestBody } from "~/types";
import { createElasticsearchClient, deleteAllIndices } from "./helpers";

const indexTestName = "dummy-index-test";
/**
 * Add configurations when added to the code.
 */
const settings: [string, ElasticsearchIndexRequestBody][] = [
    ["base", base],
    ["japanese", japanese]
];

describe("Elasticsearch Index Mapping And Settings", () => {
    let client: Client;

    beforeEach(async () => {
        client = createElasticsearchClient();
        await deleteAllIndices(client);
    });

    afterEach(async () => {
        await deleteAllIndices(client);
    });

    it.each(settings)(
        "should create index with correct settings - %s",
        // @ts-ignore
        async (name: string, setting: ElasticsearchIndexRequestBody) => {
            const createResponse = await client.indices.create({
                index: indexTestName,
                body: {
                    ...setting
                }
            });

            expect(createResponse).toMatchObject({
                body: {
                    acknowledged: true,
                    index: indexTestName
                },
                statusCode: 200
            });

            const mappingResponse = await client.indices.getMapping({
                index: indexTestName
            });

            expect(mappingResponse.body).toEqual({
                [indexTestName]: {
                    mappings: {
                        ...setting.mappings
                    }
                }
            });

            const settingsResponse = await client.indices.getSettings({
                index: indexTestName
            });

            expect(settingsResponse.body).toEqual({
                [indexTestName]: {
                    settings: {
                        ...setting.settings,
                        index: {
                            ...setting.settings.index,
                            creation_date: expect.stringMatching(/^([0-9]+)$/),
                            number_of_replicas: expect.stringMatching(/^([0-9]+)$/),
                            number_of_shards: expect.stringMatching(/^([0-9]+)$/),
                            provided_name: indexTestName,
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
