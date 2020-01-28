import { graphql } from "graphql";
import { setupSchema } from "@webiny/api/testing";
import headlessPlugins from "../../src/plugins";

export default ({ plugins }) => {
    let testing;

    beforeAll(async () => {
        // Setup schema
        testing = await setupSchema([plugins, headlessPlugins()]);
    });

    test("create content model", async () => {
        const query = /* GraphQL */ `
            mutation {
                cmsManage {
                    createContentModel(
                        data: {
                            title: "Product"
                            modelId: "product"
                            description: "Sell stuff"
                            fields: []
                        }
                    ) {
                        data {
                            id
                            modelId
                        }
                        error {
                            code
                            data
                            message
                        }
                    }
                }
            }
        `;

        const response = await graphql(testing.schema, query, {}, testing.context);

        expect(response).toMatchObject({
            data: {
                cmsManage: {
                    createContentModel: {
                        data: {
                            id: expect.stringMatching("^[0-9a-fA-F]{24}$"),
                            modelId: "product"
                        }
                    }
                }
            }
        });
    });

    test("list content models", async () => {
        const query = /* GraphQL */ `
            query {
                cmsManage {
                    listContentModels {
                        data {
                            id
                            modelId
                        }
                        error {
                            code
                            data
                            message
                        }
                    }
                }
            }
        `;

        const response = await graphql(testing.schema, query, {}, testing.context);

        expect(response).toMatchObject({
            data: {
                cmsManage: {
                    listContentModels: {
                        data: expect.arrayContaining([
                            expect.objectContaining({
                                id: expect.stringMatching("^[0-9a-fA-F]{24}$"),
                                modelId: expect.stringMatching(/review|product|category/)
                            })
                        ])
                    }
                }
            }
        });
    });
};
