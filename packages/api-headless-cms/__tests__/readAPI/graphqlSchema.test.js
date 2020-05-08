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

describe("READ - GraphQL Schema", () => {
    let contentModels;

    const { useSchema, useDatabase } = createUtils([
        headlessPlugins({ type: "read", environment: "production" })
    ]);

    const db = useDatabase();

    beforeAll(async () => {
        await setupDefaultEnvironment(db);
        const { context } = await useSchema();
        ({ contentModels } = await setupContentModels(context));
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
});
