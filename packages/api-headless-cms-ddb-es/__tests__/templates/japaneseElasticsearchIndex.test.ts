import { Client } from "@elastic/elasticsearch";
import {
    clearTemplate,
    createElasticsearchClient,
    putTemplate,
    getTemplate,
    deleteIndex
} from "../helpers";
import { base as baseTemplate } from "~/elasticsearch/templates/base";
import { jp as japaneseTemplate } from "~/elasticsearch/templates/jp";
import lodashCloneDeep from "lodash/cloneDeep";

const baseTemplateName = baseTemplate.template.name;
const jpTemplateName = japaneseTemplate.template.name;

const testJaJpIndexName = "root-ja-jp-headless-cms-articles";
const testJaIndexName = "root-ja-headless-cms-articles";

describe("Japanese Elasticsearch Index and Templates", () => {
    let client: Client;

    beforeEach(async () => {
        try {
            client = createElasticsearchClient();
            await clearTemplate(client, [baseTemplateName, jpTemplateName]);
            await deleteIndex(client, [testJaJpIndexName, testJaIndexName]);
        } catch (ex) {
            console.log(JSON.stringify(ex));
            throw ex;
        }
    });

    afterEach(async () => {
        await clearTemplate(client, [baseTemplateName, jpTemplateName]);
        await deleteIndex(client, [testJaJpIndexName, testJaIndexName]);
    });

    it("should add Japanese template after the default one", async () => {
        /**
         * Insert the base and the Japanese templates
         */
        const baseInsert = await putTemplate(client, baseTemplate.template);

        expect(baseInsert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const japaneseInsert = await putTemplate(client, japaneseTemplate.template);

        expect(japaneseInsert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        /**
         * Verify that both of the templates are in
         */

        const response = await getTemplate(client);

        const japaneseTemplateSettings = lodashCloneDeep(japaneseTemplate.template.body.settings);
        delete japaneseTemplateSettings.index.analysis.analyzer.lowercase_analyzer;

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
                        ...japaneseTemplate.template.body.mappings
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
                        ...japaneseTemplate.template.body.mappings
                    }
                }
            },
            statusCode: 200
        });
        const jaJpIndexConfig = jaJpGetIndex.body[testJaJpIndexName];
        expect(jaJpIndexConfig).toEqual({
            aliases: {},
            settings: {
                index: {
                    ...japaneseTemplate.template.body.settings.index,
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
                ...japaneseTemplate.template.body.mappings
            }
        });
    });
});
