import { graphql } from "graphql";
import { createUtils } from "../utils";
import headlessPlugins from "../../src/handler/plugins";
import setupDefaultEnvironment from "../setup/setupDefaultEnvironment";
import setupContentModels from "../setup/setupContentModels";

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
            const data = newContentModels[i];
            responses.push(await graphql(schema, mutation, {}, context, { data }));
        }

        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            expect(response).toMatchObject({
                data: {
                    createContentModel: {
                        data: {
                            id: expect.stringMatching("^[0-9a-fA-F]{24}$"),
                            modelId: newContentModels[i].modelId
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
            responses.push(
                await graphql(schema, mutation, {}, context, { data: contentModels[i] })
            );
        }

        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            expect(response).toEqual({
                data: {
                    createContentModel: {
                        error: {
                            message: `Content model with modelId "${contentModels[i].modelId}" already exists.`
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
                title: "EmptyModel",
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
            expect(context.models[contentModels[i].modelId]).toBeTruthy();
            expect(context.models[contentModels[i].modelId + "Search"]).toBeTruthy();
        }
    });

    test("create GraphQL types from content models data", async () => {
        const { schema, context } = await useSchema();
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
