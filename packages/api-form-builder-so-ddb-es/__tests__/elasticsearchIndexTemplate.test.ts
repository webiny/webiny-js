import { createElasticsearchClient } from "@webiny/api-elasticsearch/client";
import { Client } from "@elastic/elasticsearch";
import { base } from "~/elasticsearch/templates/base";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

const templateName = "form-builder-forms-index-default";

describe("Elasticsearch Index Template", () => {
    let client: Client;

    const clearTemplate = async () => {
        try {
            await client.indices.deleteIndexTemplate({
                name: templateName
            });
        } catch {}
    };

    beforeEach(async () => {
        client = createElasticsearchClient({
            node: `http://localhost:${ELASTICSEARCH_PORT}`,
            auth: {} as any
        });
        await clearTemplate();
    });

    afterEach(async () => {
        await clearTemplate();
    });

    it("should insert default index template", async () => {
        const insert = await client.indices.putIndexTemplate(base.template);

        expect(insert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const response = await client.indices.getIndexTemplate();

        expect(response).toMatchObject({
            body: {
                index_templates: expect.arrayContaining([
                    {
                        name: templateName,
                        index_template: expect.any(Object)
                    }
                ])
            },
            statusCode: 200
        });
    });
});
