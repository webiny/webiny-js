import { createElasticsearchClient } from "../helpers";
import { base as baseTemplate } from "~/elasticsearch/templates/base";
import { japanese as japaneseTemplate } from "~/elasticsearch/templates/japanese";
import lodashCloneDeep from "lodash/cloneDeep";
import {
    deleteTemplates,
    putTemplate,
    getTemplates
} from "@webiny/project-utils/testing/elasticsearch/templates";
import { deleteIndexes } from "@webiny/project-utils/testing/elasticsearch/indices";

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

const baseTemplateName = `${prefix}${baseTemplate.template.name}`;
const jpTemplateName = `${prefix}${japaneseTemplate.template.name}`;

const testJaJpIndexName = `${prefix}root-ja-jp-headless-cms-articles`;
const testJaIndexName = `${prefix}root-ja-headless-cms-articles`;

describe("Japanese Elasticsearch Index and Templates", () => {
    const client = createElasticsearchClient();

    beforeEach(async () => {
        await deleteTemplates({
            client,
            prefix
        });
        await deleteIndexes({
            client,
            prefix
        });
    });

    afterEach(async () => {
        await deleteTemplates({
            client,
            prefix
        });
        await deleteIndexes({
            client,
            prefix
        });
    });

    it("should add Japanese template after the default one", async () => {
        /**
         * Insert the base and the Japanese templates
         */
        const baseInsert = await putTemplate({
            client,
            template: baseTemplate.template,
            prefix
        });

        expect(baseInsert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const japaneseInsert = await putTemplate({
            client,
            template: japaneseTemplate.template,
            prefix
        });

        expect(japaneseInsert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        /**
         * Verify that both of the templates are in
         */

        const response = await getTemplates({ client });

        const japaneseTemplateSettings = lodashCloneDeep(
            japaneseTemplate.template.body.settings
        ) as any;
        delete japaneseTemplateSettings.index.analysis.analyzer.lowercase_analyzer;
        const japaneseTemplateMappings = lodashCloneDeep(
            japaneseTemplate.template.body.mappings
        ) as any;
        delete japaneseTemplateMappings.dynamic_templates[0].strings.mapping.fields.keyword;

        expect(response).toMatchObject({
            body: {
                [baseTemplateName]: {
                    aliases: {},
                    index_patterns: [...baseTemplate.template.body.index_patterns],
                    settings: {
                        ...baseTemplate.template.body.settings
                    },
                    mappings: {
                        ...baseTemplate.template.body.mappings
                    }
                },
                [jpTemplateName]: {
                    aliases: {},
                    index_patterns: [...japaneseTemplate.template.body.index_patterns],
                    settings: {
                        ...japaneseTemplateSettings
                    },
                    mappings: {
                        ...japaneseTemplateMappings
                    }
                }
            },
            statusCode: 200
        });
        /**
         * Now let's create the ja-jp and ja index and make sure they have the correct mappings and settings
         */
        const jaJpCreateIndex = await client.indices.create({
            index: testJaJpIndexName
        });

        expect(jaJpCreateIndex).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const jaCreateIndex = await client.indices.create({
            index: testJaIndexName
        });

        expect(jaCreateIndex).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const jaJpGetIndex = await client.indices.get({
            index: testJaJpIndexName
        });

        /**
         * we need to add lowercase_analyzer to the response because its there in the settings but elasticsearch skips it since its empty
         */

        expect(jaJpGetIndex).toMatchObject({
            body: {
                [testJaJpIndexName]: {
                    aliases: {},
                    settings: {
                        ...japaneseTemplate.template.body.settings
                    },
                    mappings: {
                        ...japaneseTemplateMappings
                    }
                }
            },
            statusCode: 200
        });
        const jaJpIndexConfig = jaJpGetIndex.body[testJaJpIndexName];
        expect(jaJpIndexConfig).toMatchObject({
            aliases: {},
            settings: {
                index: {
                    ...(japaneseTemplate.template.body.settings?.index || {}),
                    creation_date: expect.stringMatching(/^([0-9]+)$/),
                    number_of_replicas: expect.stringMatching(/^([0-9]+)$/),
                    number_of_shards: expect.stringMatching(/^([0-9]+)$/),
                    provided_name: testJaJpIndexName,
                    uuid: expect.stringMatching(/^([a-zA-Z0-9_-]+)$/),
                    version: {
                        created: expect.stringMatching(/^([0-9]+)$/)
                    }
                }
            },
            mappings: {
                ...japaneseTemplateMappings
            }
        });
    });
});
