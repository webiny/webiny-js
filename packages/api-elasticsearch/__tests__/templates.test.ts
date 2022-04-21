import { base } from "~/indexConfiguration/base";
import { japanese } from "~/indexConfiguration/japanese";
import { ElasticsearchIndexRequestBody } from "~/types";
import { createElasticsearchClient } from "./helpers";

import {
    deleteTemplates,
    putTemplate,
    getTemplates
} from "@webiny/project-utils/testing/elasticsearch/templates";
import { deleteIndexes } from "@webiny/project-utils/testing/elasticsearch/indices";

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

/**
 * Add configurations when added to the code.
 */
const settings: [string, ElasticsearchIndexRequestBody][] = [
    ["base", base],
    ["japanese", japanese]
];

const order = 75;

const createIndexPattern = (name: string): string => {
    return `test-index-${name}-*`;
};

describe("Elasticsearch Templates", () => {
    const client = createElasticsearchClient();

    beforeEach(async () => {
        await deleteIndexes({ client });
        await deleteTemplates({ client });
    });

    afterEach(async () => {
        await deleteIndexes({ client });
        await deleteTemplates({ client });
    });

    it.each(settings)(
        "should create template with correct settings - %s",
        // @ts-ignore
        async (name: string, setting: ElasticsearchIndexRequestBody) => {
            /**
             * First we need to create the template.
             */
            const templateName = `template-${name}`;
            const prefixedTemplateName = `${prefix}${templateName}`;
            const index_patterns: string[] = [createIndexPattern(name)];

            const createResponse = await putTemplate({
                client,
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
                    [prefixedTemplateName]: {
                        ...setting,
                        order,
                        aliases: {},
                        index_patterns
                    }
                },
                statusCode: 200
            });

            expect(response.body[prefixedTemplateName]).toEqual({
                ...setting,
                order,
                aliases: {},
                index_patterns
            });

            const testIndexName = `test-index-${name}-locale-code`;
            const prefixedTestIndexName = `${prefix}${testIndexName}`;
            /**
             * Then create the index with given pattern...
             */
            const createIndexResponse = await client.indices.create({
                index: prefixedTestIndexName
            });
            expect(createIndexResponse).toMatchObject({
                body: {
                    acknowledged: true,
                    index: prefixedTestIndexName
                },
                statusCode: 200
            });
            /**
             * And finally verify that index has correct configuration
             */
            const mappings = await client.indices.getMapping({
                index: prefixedTestIndexName
            });
            expect(mappings.body[prefixedTestIndexName].mappings).toEqual({
                ...setting.mappings
            });

            const settings = await client.indices.getSettings({
                index: prefixedTestIndexName
            });
            expect(settings.body[prefixedTestIndexName].settings).toEqual({
                ...setting.settings,
                index: {
                    ...setting.settings.index,
                    creation_date: expect.stringMatching(/^([0-9]+)$/),
                    number_of_replicas: expect.stringMatching(/^([0-9]+)$/),
                    number_of_shards: expect.stringMatching(/^([0-9]+)$/),
                    provided_name: prefixedTestIndexName,
                    uuid: expect.stringMatching(/^([a-zA-Z0-9_-]+)$/),
                    version: {
                        created: expect.stringMatching(/^([0-9]+)$/)
                    }
                }
            });
        }
    );
});
