import { graphql } from "graphql";
import { createUtils } from "../utils";
import contentModels from "../mocks/contentModels";
import contentModelGroupData from "../mocks/contentModelGroup";
import headlessPlugins from "../../src/handler/plugins";
import setupDefaultEnvironment from "../setup/setupDefaultEnvironment";

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

describe("GraphQL Schema", () => {
    const { useSchema, useDatabase } = createUtils([
        headlessPlugins({ type: "read", environment: "production" })
    ]);

    const db = useDatabase();

    beforeAll(async () => {
        await setupDefaultEnvironment(db);

        const { context } = await useSchema();

        const ContentModel = context.models.CmsContentModel;
        const ContentModelGroup = context.models.CmsContentModelGroup;

        const contentModelGroup = new ContentModelGroup();
        contentModelGroup.populate(contentModelGroupData);
        await contentModelGroup.save();

        for (let i = 0; i < contentModels.length; i++) {
            const contentModel = new ContentModel();
            contentModel.populate(contentModels[i]);
            await contentModel.save();
        }
    });

    test("create commodo models and set them in the context", async () => {
        const { context } = await useSchema();
        for (let i = 0; i < contentModels.length; i++) {
            expect(context.models[contentModels[i].modelId]).toBeTruthy();
            expect(context.models[contentModels[i].modelId + "Search"]).toBeTruthy();
        }
    });

    // test("create GraphQL types from content models data", async () => {
    //     const { schema, context } = await useSchema();
    //     const response = await graphql(schema, schemaTypesQuery, {}, context);
    //     const typeNames = contentModels.reduce((acc, item) => {
    //         acc.push(item.title);
    //         return acc;
    //     }, []);
    //     const cmsTypes = response.data.__schema.types
    //         .filter(t => typeNames.includes(t.name))
    //         .map(t => t.name);
    //
    //     expect(cmsTypes).toContain("Category");
    //     expect(cmsTypes).toContain("Product");
    //     expect(cmsTypes).toContain("Review");
    // });
});
