import { createElasticsearchClient } from "@webiny/api-elasticsearch/client";
import { Client } from "@elastic/elasticsearch";
import { base } from "~/elasticsearch/templates/base";
import { ElasticsearchIndexTemplatePluginConfig } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";
import { PageElasticsearchIndexTemplatePlugin } from "~/plugins/definitions/PageElasticsearchIndexTemplatePlugin";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

const defaultTemplateName = "page-builder-pages-index-default";
const defaultTemplateOrder = 350;

const testPageBuilderIndexName = "test-page-builder";

const noPropertyIndex = new PageElasticsearchIndexTemplatePlugin({
    name: "no-property-pages-index",
    order: 351,
    body: {
        index_patterns: ["*test-page-builder"],
        mappings: {
            properties: {
                rawValues: {
                    enabled: false
                }
            }
        }
    }
});

const disableSourceIndex = new PageElasticsearchIndexTemplatePlugin({
    name: "disable-source-pages-index",
    order: 352,
    body: {
        index_patterns: ["*test-page-builder"],
        mappings: {
            _source: {
                enabled: false
            }
        }
    }
});

describe("Elasticsearch Index Template", () => {
    let client: Client;

    const clearTemplate = async (debug = true) => {
        try {
            await client.indices.deleteTemplate({
                name: defaultTemplateName
            });
        } catch (ex) {
            if (!debug) {
                return;
            }
            console.log("Could not delete template.");
            console.log(JSON.stringify(ex));
        }
    };

    const putTemplate = async (template: ElasticsearchIndexTemplatePluginConfig) => {
        try {
            return await client.indices.putTemplate(template);
        } catch (ex) {
            console.log("Could not put template.");
            console.log(JSON.stringify(ex));
            throw ex;
        }
    };

    const getTemplate = async () => {
        try {
            return await client.indices.getTemplate();
        } catch (ex) {
            console.log("Could not get templates.");
            console.log(JSON.stringify(ex));
            throw ex;
        }
    };

    const clearIndex = async () => {
        const { body } = await client.indices.exists({
            index: testPageBuilderIndexName
        });

        if (!body) {
            return;
        }
        await client.indices.delete({
            index: testPageBuilderIndexName
        });
    };

    beforeAll(async () => {
        try {
            client = createElasticsearchClient({
                node: `http://localhost:${ELASTICSEARCH_PORT}`,
                auth: {} as any,
                maxRetries: 10,
                pingTimeout: 500
            });
            await clearIndex();
        } catch (ex) {
            console.log(JSON.stringify(ex));
            throw ex;
        }
    });

    beforeEach(async () => {
        try {
            await clearTemplate(false);
        } catch (ex) {
            console.log(JSON.stringify(ex));
            throw ex;
        }
    });

    afterEach(async () => {
        await clearTemplate();
    });

    it("should insert default index template", async () => {
        const insert = await putTemplate(base.template);

        expect(insert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const response = await getTemplate();

        expect(response).toMatchObject({
            body: {
                [defaultTemplateName]: {
                    order: defaultTemplateOrder,
                    index_patterns: ["*-page-builder"]
                }
            },
            statusCode: 200
        });
    });

    it("should insert default template and add few more", async () => {
        await putTemplate(base.template);

        const insertPropertyNoIndexResult = await putTemplate(noPropertyIndex.template);
        expect(insertPropertyNoIndexResult).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const insertDisableSourceIndexResult = await putTemplate(disableSourceIndex.template);
        expect(insertDisableSourceIndexResult).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const response = await getTemplate();

        expect(response).toMatchObject({
            body: {
                [defaultTemplateName]: {
                    order: defaultTemplateOrder,
                    index_patterns: ["*-page-builder"]
                },
                [noPropertyIndex.template.name]: {
                    order: noPropertyIndex.template.order,
                    ...noPropertyIndex.template.body
                },
                [disableSourceIndex.template.name]: {
                    order: disableSourceIndex.template.order,
                    ...disableSourceIndex.template.body
                }
            },
            statusCode: 200
        });
    });

    it("should insert templates and create index that will have those mappings", async () => {
        await putTemplate(base.template);
        await putTemplate(noPropertyIndex.template);
        await putTemplate(disableSourceIndex.template);

        const response = await client.indices.create({
            index: testPageBuilderIndexName
        });

        expect(response).toMatchObject({
            body: {
                acknowledged: true,
                index: testPageBuilderIndexName,
                shards_acknowledged: true
            },
            meta: {
                aborted: false
            },
            statusCode: 200
        });
    });
});
