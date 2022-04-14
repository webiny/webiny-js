import { base } from "~/elasticsearch/templates/base";

import {
    createElasticsearchClient,
    deleteAllTemplates,
    getTemplate,
    putTemplate
} from "../../api-elasticsearch/__tests__/helpers";

const templateName = "form-builder-forms-index-default";

describe("Elasticsearch Index Template", () => {
    const client = createElasticsearchClient();

    beforeEach(async () => {
        try {
            await deleteAllTemplates(client);
        } catch (ex) {
            console.log(JSON.stringify(ex));
            throw ex;
        }
    });

    afterEach(async () => {
        await deleteAllTemplates(client);
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
                    index_patterns: ["*-form-builder"]
                }
            },
            statusCode: 200
        });
    });
});
