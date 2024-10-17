import { getJapaneseConfiguration } from "~/indexConfiguration";
import { createElasticsearchClient } from "../helpers";
import { getElasticsearchIndexPrefix } from "~/indexPrefix";

describe("Elasticsearch Japanese", () => {
    const client = createElasticsearchClient();

    const prefix: string = getElasticsearchIndexPrefix();

    const indexTestName = `${prefix}index-japanese-index-test`;

    beforeEach(async () => {
        return client.indices.deleteAll();
    });

    afterEach(async () => {
        return client.indices.deleteAll();
    });

    it("should create index", async () => {
        const japanese = getJapaneseConfiguration();

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

        expect(settingsResponse.body).toMatchObject({
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
