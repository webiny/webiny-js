import { graphql } from "graphql";
import { setupSchema } from "@webiny/api/testing";
import contentModels from "./data/contentModels";
import headlessPlugins from "../../src/plugins";

const schemaTypes = /* GraphQL */ `
    {
        __schema {
            types {
                name
                fields {
                    name
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

// const response = await graphql(testing.schema, schemaTypes, {}, testing.context);
// const cmsTypes = response.data.__schema.types.filter(t => t.name === "CmsContentModel");
// console.log(JSON.stringify(cmsTypes, null, 2));
// return;

export default ({ plugins }) => {
    describe("GraphQL API", () => {
        let testing;

        beforeEach(async () => {
            // Setup schema
            testing = await setupSchema([plugins, headlessPlugins()]);
        });

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

            const responses = [];
            for (let i = 0; i < contentModels.length; i++) {
                responses.push(
                    await graphql(testing.schema, mutation, {}, testing.context, {
                        data: contentModels[i]
                    })
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
            for (let i = 0; i < contentModels.length; i++) {
                expect(testing.context.models[contentModels[i].modelId]).toBeTruthy();
            }
        });

        test("create GraphQL types from content models data", async () => {
            const schemaTypes = /* GraphQL */ `
                {
                    __schema {
                        types {
                            name
                            fields {
                                name
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

            const response = await graphql(testing.schema, schemaTypes, {}, testing.context);
            const typeNames = contentModels.map(m => `Cms${m.title}`);
            const cmsTypes = response.data.__schema.types.filter(t => typeNames.includes(t.name));
            console.log(cmsTypes);
        });
    });
};
