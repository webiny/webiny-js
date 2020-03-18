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

        beforeAll(async () => {
            const { context } = await setupSchema();
            const ContentModel = context.models.CmsContentModel;

            for (let i = 0; i < contentModels.length; i++) {
                const contentModel = new ContentModel();
                contentModel.populate(contentModels[i]);
                await contentModel.save();
            }
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
