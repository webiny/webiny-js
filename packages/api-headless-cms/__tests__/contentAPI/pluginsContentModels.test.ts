import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { ContentModelPlugin } from "@webiny/api-headless-cms/content/plugins/ContentModelPlugin";
import { introspectionQuery } from "graphql/utilities";

const contentModelPlugin = new ContentModelPlugin({
    contentModel: {
        name: "Product",
        modelId: "product",
        locale: "en-us",
        group: {
            id: "ecommerce",
            name: "E-Commerce"
        },
        fields: [
            {
                id: "firstName",
                fieldId: "firstName",
                type: "text",
                label: "First Name"
            },
            {
                id: "lastName",
                fieldId: "lastName",
                type: "text",
                label: "Last Name"
            }
        ],
        layout: [],
        lockedFields: [],
        titleFieldId: "asd"
    }
});

describe("content model plugins", () => {
    test("content model-specific query and mutation operations should be present in the schema", async () => {
        const { invoke } = useContentGqlHandler(
            {
                path: "manage/en-US"
            },
            [contentModelPlugin]
        );

        const reza = await invoke({ body: { query: introspectionQuery } });
        const aa = 123;
    });
});
