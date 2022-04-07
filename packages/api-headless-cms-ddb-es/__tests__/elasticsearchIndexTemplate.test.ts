import { createElasticsearchClient } from "@webiny/api-elasticsearch/client";
import { Client } from "@elastic/elasticsearch";
import { base } from "~/elasticsearch/templates/base";
import { ElasticsearchIndexTemplatePluginConfig } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

const templateName = "headless-cms-entries-index-default";

describe("Elasticsearch Index Template", () => {
    let client: Client;

    const clearTemplate = async () => {
        try {
            await client.indices.deleteTemplate({
                name: templateName
            });
        } catch (ex) {
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

    beforeEach(async () => {
        try {
            client = createElasticsearchClient({
                node: `http://localhost:${ELASTICSEARCH_PORT}`,
                auth: {} as any,
                maxRetries: 10,
                pingTimeout: 500
            });
            await clearTemplate();
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
                [templateName]: {
                    index_patterns: ["*-headless-cms-*"]
                }
            },
            statusCode: 200
        });
    });
});
