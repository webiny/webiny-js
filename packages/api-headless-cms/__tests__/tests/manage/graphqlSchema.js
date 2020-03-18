import { graphql } from "graphql";
import contentModels from "../data/contentModels";

const schemaTypesQuery = /* GraphQL */ `
    {
        __schema {
            types {
                name
                fields {
                    name
                    args {
                        name
                        type {
                            name
                            kind
                            ofType {
                                name
                            }
                        }
                    }
                    type {
                        name
                        kind
                        ofType {
                            name
                        }
                    }
                }
            }
        }
    }
`;

export default ({ setupSchema }) => {
    describe("GraphQL Schema", () => {
        test("insert content models data", async () => {
            const mutation = /* GraphQL */ `
                mutation CreateContentModel($data: CmsContentModelInput!) {
                    createContentModel(data: $data) {
                        data {
                            id
                            modelId
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();

            const responses = [];
            for (let i = 0; i < contentModels.length; i++) {
                responses.push(
                    await graphql(schema, mutation, {}, context, { data: contentModels[i] })
                );
            }

            for (let i = 0; i < responses.length; i++) {
                const response = responses[i];
                expect(response).toMatchObject({
                    data: {
                        createContentModel: {
                            data: {
                                id: expect.stringMatching("^[0-9a-fA-F]{24}$"),
                                modelId: expect.stringMatching(/^[a-z]+$/)
                            }
                        }
                    }
                });
            }
        });

        test("insert content models data (empty fields)", async () => {
            const mutation = /* GraphQL */ `
                mutation CreateContentModel($data: CmsContentModelInput!) {
                    createContentModel(data: $data) {
                        data {
                            id
                            modelId
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();

            const response = await graphql(schema, mutation, {}, context, {
                data: {
                    title: "EmptyModel",
                    modelId: "emptyModel"
                }
            });

            expect(response).toMatchObject({
                data: {
                    createContentModel: {
                        data: {
                            id: expect.stringMatching("^[0-9a-fA-F]{24}$"),
                            modelId: expect.stringMatching(/^[a-zA-Z]+$/)
                        }
                    }
                }
            });
        });

        test("create commodo models and set them in the context", async () => {
            const { context } = await setupSchema();

            for (let i = 0; i < contentModels.length; i++) {
                expect(context.models[contentModels[i].modelId]).toBeTruthy();
                expect(context.models[contentModels[i].modelId + "Search"]).toBeTruthy();
            }
        });

        test("create GraphQL types from content models data", async () => {
            const { schema, context } = await setupSchema();
            const response = await graphql(schema, schemaTypesQuery, {}, context);
            const typeNames = contentModels.reduce((acc, item) => {
                acc.push(item.title);
                return acc;
            }, []);
            const cmsTypes = response.data.__schema.types
                .filter(t => typeNames.includes(t.name))
                .map(t => t.name);

            expect(cmsTypes).toContain("Category");
            expect(cmsTypes).toContain("Product");
            expect(cmsTypes).toContain("Review");
        });
    });
};
