import { base } from "~/elasticsearch/templates/base";
import { clearTemplate, getTemplate, putTemplate, createElasticsearchClient } from "../helpers";

const templateName = base.template.name;

describe("Elasticsearch Index Template", () => {
    const client = createElasticsearchClient();

    beforeEach(async () => {
        try {
            await clearTemplate(client, templateName);
        } catch (ex) {
            console.log(JSON.stringify(ex));
            throw ex;
        }
    });

    afterEach(async () => {
        await clearTemplate(client, templateName);
    });

    it("should insert default index template", async () => {
        const insert = await putTemplate(client, base.template);

        expect(insert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const response = await getTemplate(client);

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
