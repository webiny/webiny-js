import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getBaseConfiguration } from "~/indexConfiguration/index.js";
import { OpenSearchIndexRequestBody } from "~/types.js";
import { createOpenSearchClient } from "./helpers";
import { getOpenSearchIndexPrefix } from "~/indexPrefix.js";

/**
 * Add configurations when added to the code.
 */
const settings: [string, OpenSearchIndexRequestBody][] = [["base", getBaseConfiguration()]];

describe("OpenSearch Index Mapping And Settings", () => {
    const client = createOpenSearchClient();

    const prefix: string = getOpenSearchIndexPrefix();

    const testIndexName = `${prefix}dummy-index-test`;

    beforeEach(async () => {
        return client.indices.deleteAll();
    });

    afterEach(async () => {
        return client.indices.deleteAll();
    });

    it.each(settings)(
        "should create index with correct settings - %s",
        async (_: string, setting: OpenSearchIndexRequestBody) => {
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

            expect(settingsResponse.body).toMatchObject({
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
