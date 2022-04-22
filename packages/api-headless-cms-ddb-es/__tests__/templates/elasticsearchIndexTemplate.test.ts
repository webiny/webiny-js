import { base } from "~/elasticsearch/templates/base";
import { createElasticsearchClient } from "../helpers";

import {
    // deleteTemplates,
    putTemplate,
    getTemplates
} from "@webiny/project-utils/testing/elasticsearch/templates";

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

const templateName = `${prefix}${base.template.name}`;

describe("Elasticsearch Index Template", () => {
    const client = createElasticsearchClient();

    beforeEach(async () => {
        // await deleteTemplates({
        //     client,
        //     templates: [templateName]
        // });
    });

    afterEach(async () => {
        // await deleteTemplates({
        //     client,
        //     templates: [templateName]
        // });
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

        const response = await getTemplates({
            client
        });

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
