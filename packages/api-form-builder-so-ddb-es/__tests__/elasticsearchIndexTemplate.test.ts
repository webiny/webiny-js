import { base } from "~/elasticsearch/templates/base";

import { createElasticsearchClient } from "../../api-elasticsearch/__tests__/helpers";
import {
    deleteTemplates,
    putTemplate,
    getTemplates
} from "@webiny/project-utils/testing/elasticsearch/templates";

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

const templateName = `${prefix}form-builder-forms-index-default`;

describe("Elasticsearch Index Template", () => {
    const client = createElasticsearchClient();

    beforeEach(async () => {
        await deleteTemplates({
            client,
            prefix
        });
    });

    afterEach(async () => {
        await deleteTemplates({
            client,
            prefix
        });
    });

    it("should insert default index template", async () => {
        const insert = await putTemplate({
            client,
            template: base.template,
            prefix
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
