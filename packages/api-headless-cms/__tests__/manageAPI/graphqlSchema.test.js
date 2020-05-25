import { graphql } from "graphql";
import { createUtils } from "../utils";
import headlessPlugins from "../../src/content/plugins";
import setupDefaultEnvironment from "../setup/setupDefaultEnvironment";
import setupContentModels from "../setup/setupContentModels";
import camelCase from "lodash/camelCase";
import omit from "lodash/omit";

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

describe("MANAGE - GraphQL Schema", () => {
    let contentModels;
    let contentModelGroup;

    const { useSchema, useDatabase, useContext } = createUtils([
        headlessPlugins({ type: "manage", environment: "production" })
    ]);

    const db = useDatabase();

    beforeAll(async () => {
        await setupDefaultEnvironment(db);
        const context = await useContext();
        ({ contentModels, contentModelGroup } = await setupContentModels(context));
    });

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

        const { schema, context } = await useSchema();

        const responses = [];
        const newContentModels = contentModels.map(item => {
            item.modelId = item.modelId + "-new";
            return item;
        });

        for (let i = 0; i < newContentModels.length; i++) {
            const data = omit(newContentModels[i], ["getUniqueIndexFields", "indexes"]);
            responses.push(await graphql(schema, mutation, {}, context, { data }));
        }

        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            expect(response).toMatchObject({
                data: {
                    createContentModel: {
                        data: {
                            id: expect.stringMatching("^[0-9a-fA-F]{24}$"),
                            modelId: camelCase(newContentModels[i].modelId)
                        }
                    }
                }
            });
        }
    });

    test("should not be able to insert content models with same modelId", async () => {
        const mutation = /* GraphQL */ `
            mutation CreateContentModel($data: CmsContentModelInput!) {
                createContentModel(data: $data) {
                    error {
                        message
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();

        const responses = [];
        for (let i = 0; i < contentModels.length; i++) {
            const data = omit(contentModels[i], ["getUniqueIndexFields", "indexes"]);

            responses.push(await graphql(schema, mutation, {}, context, { data }));
        }

        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            expect(response).toEqual({
                data: {
                    createContentModel: {
                        error: {
                            message: `Content model with modelId "${camelCase(
                                contentModels[i].modelId
                            )}" already exists.`
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

        const { schema, context } = await useSchema();

        const response = await graphql(schema, mutation, {}, context, {
            data: {
                name: "EmptyModel",
                modelId: "emptyModel",
                group: contentModelGroup.id
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
        const { context } = await useSchema();

        for (let i = 0; i < contentModels.length; i++) {
            expect(context.models[camelCase(contentModels[i].modelId)]).toBeTruthy();
        }
    });

    test("create GraphQL types from content models data", async () => {
        const { schema, context } = await useSchema();
        const response = await graphql(schema, schemaTypesQuery, {}, context);
        const typeNames = contentModels.reduce((acc, item) => {
            acc.push(item.name);
            return acc;
        }, []);
        const cmsTypes = response.data.__schema.types
            .filter(t => typeNames.includes(t.name))
            .map(t => t.name);

        expect(cmsTypes).toContain("Category");
        expect(cmsTypes).toContain("Product");
        expect(cmsTypes).toContain("Review");
    });

    test(`should correctly check if "indexes" field is "dirty"`, async () => {
        const { models } = await useContext();
        // Get content model to fetch model indexes
        const categoryModel = await models.CmsContentModel.findOne({
            query: { modelId: "category" }
        });

        // Update content model indexes
        categoryModel.indexes = [{ fields: ["slug"] }];

        expect(categoryModel.getField("indexes").isDirty()).toBe(true);

        categoryModel.getField("indexes").state.dirty = false;

        categoryModel.indexes = [{ fields: ["slug"] }];
        expect(categoryModel.getField("indexes").isDirty()).toBe(false);

        categoryModel.indexes = [{ fields: ["title", "slug"] }];
        expect(categoryModel.getField("indexes").isDirty()).toBe(true);
        categoryModel.getField("indexes").state.dirty = false;

        categoryModel.indexes = [{ fields: ["slug", "title"] }];
        expect(categoryModel.getField("indexes").isDirty()).toBe(false);

        categoryModel.indexes = [{ fields: ["title", "price"] }];
        expect(categoryModel.getField("indexes").isDirty()).toBe(true);
    });
});
