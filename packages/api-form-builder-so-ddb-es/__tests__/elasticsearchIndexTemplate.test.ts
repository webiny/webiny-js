import { base } from "~/elasticsearch/templates/base";

import { createElasticsearchClient } from "../../api-elasticsearch/__tests__/helpers";
import {
    // deleteTemplates,
    putTemplate,
    getTemplates
} from "@webiny/project-utils/testing/elasticsearch/templates";

const templateName = "form-builder-forms-index-default";

describe("Elasticsearch Index Template", () => {
    const client = createElasticsearchClient();

    beforeEach(async () => {
        // try {
        //     await deleteTemplates({ client });
        // } catch (ex) {
        //     console.log(JSON.stringify(ex));
        //     throw ex;
        // }
    });

    afterEach(async () => {
        // await deleteTemplates({ client });
    });

    it("should insert default index template", async () => {
        const insert = await putTemplate({
            client,
            template: base.template
        });

        expect(insert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const response = await getTemplates({ client });

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
