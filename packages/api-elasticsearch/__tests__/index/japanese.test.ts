import { japanese } from "~/indexConfiguration/japanese";
import { createElasticsearchClient } from "../helpers";
import { deleteTemplates } from "@webiny/project-utils/testing/elasticsearch/templates";
import { deleteIndexes } from "@webiny/project-utils/testing/elasticsearch/indices";

const order = 73;

describe("Elasticsearch Japanese", () => {
    const client = createElasticsearchClient();

    const prefix: string = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

    const indexTestName = `${prefix}api-elasticsearch-japanese-index-test`;
    const indexTemplateTestName = `${prefix}api-elasticsearch-japanese-index-template-test`;

    beforeEach(async () => {
        await deleteIndexes({
            client,
            prefix
        });
        await deleteTemplates({
            client,
            prefix
        });
    });

    afterEach(async () => {
        await deleteIndexes({
            client,
            prefix
        });
        await deleteTemplates({
            client,
            prefix
        });
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
                        ...(japanese.settings?.index || {}),
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
                index_patterns: ["*japanese-index-*"],
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
                    index_patterns: ["*japanese-index-*"],
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
                        ...(japanese.settings?.index || {}),
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
