import { createElasticsearchClient } from "~/client";
import { Client } from "@elastic/elasticsearch";
import { japanese } from "~/indexConfiguration/japanese";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

const indexTestName = "japanese-index-test";
const indexTemplateTestName = "japanese-index-template-test";

const order = 73;

describe("Elasticsearch Japanese", () => {
    let client: Client;

    beforeEach(async () => {
        client = createElasticsearchClient({
            node: `http://localhost:${ELASTICSEARCH_PORT}`,
            auth: {} as any,
            maxRetries: 10,
            pingTimeout: 500
        });
        await client.indices.delete({
            index: "_all"
        });
        try {
            await client.indices.deleteTemplate({
                name: indexTemplateTestName
            });
        } catch {}
    });

    afterEach(async () => {
        await client.indices.delete({
            index: "_all"
        });
        try {
            await client.indices.deleteTemplate({
                name: indexTemplateTestName
            });
        } catch {}
    });

    it("should create index", async () => {
        const createResponse = await client.indices.create({
            index: indexTestName,
            body: {
                ...japanese
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
                    ...japanese.mappings
                }
            }
        });

        const settingsResponse = await client.indices.getSettings({
            index: indexTestName
        });

        expect(settingsResponse.body).toEqual({
            [indexTestName]: {
                settings: {
                    ...japanese.settings,
                    index: {
                        ...japanese.settings.index,
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
    });

    it("should create index template and index with correct mappings", async () => {
        /**
         * First we need to insert the template and make sure it is ok.
         */
        const createResponse = await client.indices.putTemplate({
            name: indexTemplateTestName,
            body: {
                index_patterns: ["japanese-index-*"],
                order,
                ...japanese
            }
        });

        expect(createResponse).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const getTemplateResponse = await client.indices.getTemplate({
            name: indexTemplateTestName
        });

        expect(getTemplateResponse).toMatchObject({
            body: {
                [indexTemplateTestName]: {
                    index_patterns: ["japanese-index-*"],
                    aliases: {},
                    order,
                    ...japanese
                }
            },
            statusCode: 200
        });
        /**
         * Then we create the index and verify that it has correct mappings.
         */
        const createIndexResponse = await client.indices.create({
            index: indexTestName
        });

        expect(createIndexResponse).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const mappingResponse = await client.indices.getMapping({
            index: indexTestName
        });

        expect(mappingResponse.body).toEqual({
            [indexTestName]: {
                mappings: {
                    ...japanese.mappings
                }
            }
        });

        const settingsResponse = await client.indices.getSettings({
            index: indexTestName
        });

        expect(settingsResponse.body).toEqual({
            [indexTestName]: {
                settings: {
                    ...japanese.settings,
                    index: {
                        ...japanese.settings.index,
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
    });
});
