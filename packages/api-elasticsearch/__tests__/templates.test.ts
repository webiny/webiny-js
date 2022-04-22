import { base } from "~/indexConfiguration/base";
import { japanese } from "~/indexConfiguration/japanese";
import { ElasticsearchIndexRequestBody } from "~/types";
import { createElasticsearchClient, createPrefixId } from "./helpers";

import {
    deleteTemplates,
    putTemplate,
    getTemplates
} from "@webiny/project-utils/testing/elasticsearch/templates";
import { deleteIndexes } from "@webiny/project-utils/testing/elasticsearch/indices";

/**
 * Add configurations when added to the code.
 */
const settings: [string, ElasticsearchIndexRequestBody][] = [
    ["base", base],
    ["japanese", japanese]
];

const order = 75;

const createIndexPattern = (name: string): string => {
    return `*test-index-${name}-*`;
};

describe("Elasticsearch Templates", () => {
    const client = createElasticsearchClient();

    let prefix: string = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";
    if (!prefix) {
        prefix = createPrefixId(10);
        process.env.ELASTIC_SEARCH_INDEX_PREFIX = prefix;
    }

    beforeEach(async () => {
        await deleteIndexes({ client, prefix });
        await deleteTemplates({ client, prefix });
    });

    afterEach(async () => {
        await deleteIndexes({ client, prefix });
        await deleteTemplates({ client, prefix });
    });

    it.each(settings)(
        "should create template with correct settings - %s",
        // @ts-ignore
        async (name: string, setting: ElasticsearchIndexRequestBody) => {
            /**
             * First we need to create the template.
             */
            const templateName = `${prefix}templates-test-template-${name}`;

            const index_patterns: string[] = [createIndexPattern(name)];

            const createResponse = await putTemplate({
                client,
                prefix,
                template: {
                    name: templateName,
                    order,
                    body: {
                        index_patterns,
                        aliases: {},
                        ...setting
                    }
                }
            });
            /**
             * ... verify that everything is ok.
             */
            expect(createResponse).toMatchObject({
                body: {
                    acknowledged: true
                },
                statusCode: 200
            });

            const response = await getTemplates({
                client
            });

            expect(response).toMatchObject({
                body: {
                    [templateName]: {
                        ...setting,
                        order,
                        aliases: {},
                        index_patterns
                    }
                },
                statusCode: 200
            });

            expect(response.body[templateName]).toEqual({
                settings: {},
                ...setting,
                order,
                aliases: {},
                index_patterns
            });

            const indexName = `${prefix}test-index-${name}-locale-code`;

            /**
             * Then create the index with given pattern...
             */
            const createIndexResponse = await client.indices.create({
                index: indexName
            });
            expect(createIndexResponse).toMatchObject({
                body: {
                    acknowledged: true,
                    index: indexName
                },
                statusCode: 200
            });
            /**
             * And finally verify that index has correct configuration
             */
            const mappings = await client.indices.getMapping({
                index: indexName
            });
            expect(mappings.body[indexName].mappings).toEqual({
                ...setting.mappings
            });

            const settings = await client.indices.getSettings({
                index: indexName
            });
            expect(settings.body[indexName].settings).toEqual({
                ...setting.settings,
                index: {
                    ...(setting.settings?.index || {}),
                    creation_date: expect.stringMatching(/^([0-9]+)$/),
                    number_of_replicas: expect.stringMatching(/^([0-9]+)$/),
                    number_of_shards: expect.stringMatching(/^([0-9]+)$/),
                    provided_name: indexName,
                    uuid: expect.stringMatching(/^([a-zA-Z0-9_-]+)$/),
                    version: {
                        created: expect.stringMatching(/^([0-9]+)$/)
                    }
                }
            });
        }
    );
});
