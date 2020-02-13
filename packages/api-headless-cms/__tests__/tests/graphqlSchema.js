import { graphql } from "graphql";
import { setupSchema as setupTestingSchema } from "@webiny/api/testing";
import contentModels from "./data/contentModels";
import headlessPlugins from "../../src/plugins";
import cmsReadResolvers from "./graphqlSchema/cmsReadResolvers";

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

export default ({ plugins }) => {
    describe("GraphQL Schema", () => {
        function setupSchema() {
            return setupTestingSchema([plugins, headlessPlugins()]);
        }

        test("insert content models data", async () => {
            const mutation = /* GraphQL */ `
                mutation CreateContentModel($data: CmsContentModelInput!) {
                    cmsManage {
                        createContentModel(data: $data) {
                            data {
                                id
                                modelId
                            }
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
                        cmsManage: {
                            createContentModel: {
                                data: {
                                    id: expect.stringMatching("^[0-9a-fA-F]{24}$"),
                                    modelId: expect.stringMatching(/^[a-z]+$/)
                                }
                            }
                        }
                    }
                });
            }
        });

        test("create commodo models from content models data", async () => {
            const { context } = await setupSchema();

            for (let i = 0; i < contentModels.length; i++) {
                expect(context.models[contentModels[i].modelId]).toBeTruthy();
            }
        });

        test("create GraphQL types from content models data", async () => {
            const { schema, context } = await setupSchema();
            const response = await graphql(schema, schemaTypesQuery, {}, context);
            const typeNames = contentModels.reduce((acc, item) => {
                acc.push(`CmsRead${item.title}`);
                acc.push(`CmsManage${item.title}`);
                return acc;
            }, []);
            const cmsTypes = response.data.__schema.types
                .filter(t => typeNames.includes(t.name))
                .map(t => t.name);

            expect(cmsTypes).toContain("CmsReadCategory");
            expect(cmsTypes).toContain("CmsManageCategory");
            expect(cmsTypes).toContain("CmsReadProduct");
            expect(cmsTypes).toContain("CmsManageProduct");
            expect(cmsTypes).toContain("CmsReadReview");
            expect(cmsTypes).toContain("CmsManageReview");
        });

        cmsReadResolvers({ setupSchema });
    });
};
