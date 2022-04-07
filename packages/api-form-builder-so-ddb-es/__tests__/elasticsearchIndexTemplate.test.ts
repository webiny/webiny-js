import { createElasticsearchClient } from "@webiny/api-elasticsearch/client";
import { Client } from "@elastic/elasticsearch";
import { base } from "~/elasticsearch/templates/base";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

const templateName = "form-builder-forms-index-default";

describe("Elasticsearch Index Template", () => {
    let client: Client;

    const clearTemplate = async () => {
        try {
            await client.indices.deleteTemplate({
                name: templateName
            });
        } catch {}
    };

    beforeEach(async () => {
        try {
            client = createElasticsearchClient({
                node: `http://localhost:${ELASTICSEARCH_PORT}`,
                auth: {} as any
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
        const insert = await client.indices.putTemplate(base.template);

        expect(insert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const response = await client.indices.getTemplate();

        expect(response).toMatchObject({
            body: {
                [templateName]: {
                    index_patterns: ["*-form-builder"]
                }
            },
            statusCode: 200
        });
    });
});
