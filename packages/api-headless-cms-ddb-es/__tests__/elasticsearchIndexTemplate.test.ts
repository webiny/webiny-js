import { createElasticsearchClient } from "@webiny/api-elasticsearch/client";
import { Client } from "@elastic/elasticsearch";
import { base } from "~/elasticsearch/templates/base";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

const templateName = "headless-cms-entries-index-default";

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
                    index_patterns: ["*-headless-cms-*"]
                }
            },
            statusCode: 200
        });
    });
});
