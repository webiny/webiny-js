import camelCase from "lodash/camelCase";
import { Database } from "@commodo/fields-storage-nedb";
import useContentHandler from "./../utils/useContentHandler";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";
import contentModels from "./../mocks/genericContentModels/contentModels";
import { indexes } from "@webiny/api-headless-cms/content/plugins/models/indexesField";
import { withFields } from "@webiny/commodo";

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
    const database = new Database();
    const { environment: environmentManage } = useContentHandler({ database });

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });

        const { createContentModel, content } = environmentManage(initial.environment.id);
        const models = contentModels();
        for (let i = 0; i < models.length; i++) {
            let model = models[i];
            await createContentModel({ data: model });
        }
    });

    test("modelId should automatically be camelCased", async () => {
        const { createContentModel } = environmentManage(initial.environment.id);

        const data = [
            {
                name: "Category-2",
                modelId: "category-2",
                group: initial.contentModelGroup.id
            },
            {
                name: "Product-2",
                modelId: "product-2",
                group: initial.contentModelGroup.id
            },
            {
                name: "Review-2",
                modelId: "review-2",
                group: initial.contentModelGroup.id
            }
        ];

        const newContentModels = [];
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            newContentModels.push(await createContentModel({ data: item }));
        }

        for (let i = 0; i < newContentModels.length; i++) {
            const response = newContentModels[i];
            expect(response).toMatchObject({
                id: expect.stringMatching("^[0-9a-fA-F]{24}$"),
                modelId: camelCase(data[i].modelId)
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

        const { invoke } = environmentManage(initial.environment.id);

        const data = [
            {
                name: "Category",
                modelId: "category",
                group: initial.contentModelGroup.id
            },
            {
                name: "Product",
                modelId: "product",
                group: initial.contentModelGroup.id
            },
            {
                name: "Review",
                modelId: "review",
                group: initial.contentModelGroup.id
            }
        ];

        const newContentModels = [];
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            newContentModels.push(
                await invoke({
                    body: {
                        query: mutation,
                        variables: { data: item }
                    }
                })
            );
        }

        for (let i = 0; i < newContentModels.length; i++) {
            const response = newContentModels[i];
            expect(response[0].data.createContentModel.error).toEqual({
                message: `Content model with modelId "${data[i].modelId}" already exists.`
            });
        }
    });

    test("create GraphQL types from content models data", async () => {
        const { invoke } = environmentManage(initial.environment.id);

        const [response] = await invoke({ body: { query: schemaTypesQuery } });
        const typeNames = ["Category", "Product", "Review"];
        const cmsTypes = response.data.__schema.types
            .filter(t => typeNames.includes(t.name))
            .map(t => t.name);

        expect(cmsTypes).toContain("Category");
        expect(cmsTypes).toContain("Product");
        expect(cmsTypes).toContain("Review");
    });

    test(`should correctly check if "indexes" field is "dirty"`, async () => {
        const CategoryModel = withFields({
            indexes: indexes()
        })();

        const categoryModel = new CategoryModel();
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
