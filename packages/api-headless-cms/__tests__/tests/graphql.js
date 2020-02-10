import { graphql } from "graphql";
import { setupSchema } from "@webiny/api/testing";
import { upperFirst } from "lodash";
import pluralize from "pluralize";
import contentModels from "./data/contentModels";
import headlessPlugins from "../../src/plugins";

const schemaTypes = /* GraphQL */ `
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
            const response = await graphql(testing.schema, schemaTypes, {}, testing.context);
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

        describe("cmsRead", () => {
            const contentModel = contentModels[0];
            const modelName = upperFirst(contentModel.modelId);

            test("get a single model entry", async () => {
                const { data } = await graphql(testing.schema, schemaTypes, {}, testing.context);
                const CmsReadQuery = data.__schema.types.find(type => type.name === "CmsReadQuery");
                expect(CmsReadQuery).toBeTruthy();

                const field = CmsReadQuery.fields.find(f => f.name === `get${modelName}`);
                expect(field).toBeTruthy();

                const localeArg = field.args.find(arg => arg.name === "locale");
                expect(localeArg).toMatchObject({
                    name: "locale",
                    type: {
                        name: "String",
                        kind: "SCALAR",
                        ofType: null
                    }
                });

                const whereArg = field.args.find(arg => arg.name === "where");
                expect(whereArg).toMatchObject({
                    name: "where",
                    type: {
                        name: `CmsRead${modelName}FilterInput`,
                        kind: "INPUT_OBJECT",
                        ofType: null
                    }
                });

                const sortArg = field.args.find(arg => arg.name === "sort");
                expect(sortArg).toMatchObject({
                    name: "sort",
                    type: {
                        name: null,
                        kind: "LIST",
                        ofType: {
                            name: `CmsRead${modelName}Sorter`
                        }
                    }
                });

                // return type
                expect(field.type).toMatchObject({
                    name: `CmsRead${modelName}Response`,
                    kind: "OBJECT",
                    ofType: null
                });
            });

            test(`list model entries`, async () => {
                const { data } = await graphql(testing.schema, schemaTypes, {}, testing.context);
                const CmsReadQuery = data.__schema.types.find(type => type.name === "CmsReadQuery");
                expect(CmsReadQuery).toBeTruthy();

                const listModelField = CmsReadQuery.fields.find(
                    f => f.name === `list${pluralize(modelName)}`
                );
                expect(listModelField).toBeTruthy();

                const localeArg = listModelField.args.find(arg => arg.name === "locale");
                expect(localeArg).toMatchObject({
                    name: "locale",
                    type: {
                        name: "String",
                        kind: "SCALAR",
                        ofType: null
                    }
                });

                const page = listModelField.args.find(arg => arg.name === "page");
                expect(page).toMatchObject({
                    name: "page",
                    type: {
                        name: "Int",
                        kind: "SCALAR",
                        ofType: null
                    }
                });

                const perPage = listModelField.args.find(arg => arg.name === "perPage");
                expect(perPage).toMatchObject({
                    name: "perPage",
                    type: {
                        name: "Int",
                        kind: "SCALAR",
                        ofType: null
                    }
                });

                const where = listModelField.args.find(arg => arg.name === "where");
                expect(where).toMatchObject({
                    name: "where",
                    type: {
                        name: `CmsRead${modelName}FilterInput`,
                        kind: "INPUT_OBJECT",
                        ofType: null
                    }
                });

                const sort = listModelField.args.find(arg => arg.name === "sort");
                expect(sort).toMatchObject({
                    name: "sort",
                    type: {
                        name: null,
                        kind: "LIST",
                        ofType: {
                            name: `CmsRead${modelName}Sorter`
                        }
                    }
                });

                // return type
                expect(listModelField.type).toMatchObject({
                    name: `CmsRead${modelName}ListResponse`,
                    kind: "OBJECT",
                    ofType: null
                });
            });
        });

        describe("cmsManage", () => {
            const contentModel = contentModels[0];
            const modelName = upperFirst(contentModel.modelId);

            test(`get a model entry`, async () => {
                const { data } = await graphql(testing.schema, schemaTypes, {}, testing.context);
                const CmsManageQuery = data.__schema.types.find(
                    type => type.name === "CmsManageQuery"
                );
                expect(CmsManageQuery).toBeTruthy();

                const field = CmsManageQuery.fields.find(f => f.name === `get${modelName}`);
                expect(field).toBeTruthy();

                const localeArg = field.args.find(arg => arg.name === "locale");
                expect(localeArg).toMatchObject({
                    name: "locale",
                    type: {
                        name: "String",
                        kind: "SCALAR",
                        ofType: null
                    }
                });

                const idArg = field.args.find(arg => arg.name === "id");
                expect(idArg).toMatchObject({
                    name: "id",
                    type: {
                        name: "ID",
                        kind: "SCALAR",
                        ofType: null
                    }
                });

                // return type
                expect(field.type).toMatchObject({
                    name: `CmsManage${modelName}Response`,
                    kind: "OBJECT",
                    ofType: null
                });
            });

            test(`list model entries`, async () => {
                const { data } = await graphql(testing.schema, schemaTypes, {}, testing.context);
                const CmsManageQuery = data.__schema.types.find(
                    type => type.name === "CmsManageQuery"
                );
                expect(CmsManageQuery).toBeTruthy();

                const listModelField = CmsManageQuery.fields.find(
                    f => f.name === `list${pluralize(modelName)}`
                );
                expect(listModelField).toBeTruthy();

                const localeArg = listModelField.args.find(arg => arg.name === "locale");
                expect(localeArg).toMatchObject({
                    name: "locale",
                    type: {
                        name: "String",
                        kind: "SCALAR",
                        ofType: null
                    }
                });

                const page = listModelField.args.find(arg => arg.name === "page");
                expect(page).toMatchObject({
                    name: "page",
                    type: {
                        name: "Int",
                        kind: "SCALAR",
                        ofType: null
                    }
                });

                const perPage = listModelField.args.find(arg => arg.name === "perPage");
                expect(perPage).toMatchObject({
                    name: "perPage",
                    type: {
                        name: "Int",
                        kind: "SCALAR",
                        ofType: null
                    }
                });

                const where = listModelField.args.find(arg => arg.name === "where");
                expect(where).toMatchObject({
                    name: "where",
                    type: {
                        name: `CmsManage${modelName}FilterInput`,
                        kind: "INPUT_OBJECT",
                        ofType: null
                    }
                });

                const sort = listModelField.args.find(arg => arg.name === "sort");
                expect(sort).toMatchObject({
                    name: "sort",
                    type: {
                        name: null,
                        kind: "LIST",
                        ofType: {
                            name: `CmsManage${modelName}Sorter`
                        }
                    }
                });

                // return type
                expect(listModelField.type).toMatchObject({
                    name: `CmsManage${modelName}ListResponse`,
                    kind: "OBJECT",
                    ofType: null
                });
            });

            test(`create a model entry`, async () => {
                const { data } = await graphql(testing.schema, schemaTypes, {}, testing.context);
                const CmsManageMutation = data.__schema.types.find(
                    type => type.name === "CmsManageMutation"
                );
                expect(CmsManageMutation).toBeTruthy();

                const field = CmsManageMutation.fields.find(f => f.name === `create${modelName}`);
                expect(field).toBeTruthy();

                const dataArg = field.args.find(arg => arg.name === "data");
                expect(dataArg).toMatchObject({
                    name: "data",
                    type: {
                        name: null,
                        kind: "NON_NULL",
                        ofType: {
                            name: `CmsManage${modelName}Input`
                        }
                    }
                });

                // return type
                expect(field.type).toMatchObject({
                    name: `CmsManage${modelName}Response`,
                    kind: "OBJECT",
                    ofType: null
                });
            });

            test(`update a model entry`, async () => {
                const { data } = await graphql(testing.schema, schemaTypes, {}, testing.context);
                const CmsManageMutation = data.__schema.types.find(
                    type => type.name === "CmsManageMutation"
                );
                expect(CmsManageMutation).toBeTruthy();

                const field = CmsManageMutation.fields.find(f => f.name === `update${modelName}`);
                expect(field).toBeTruthy();
                
                const idArg = field.args.find(arg => arg.name === "id");
                expect(idArg).toMatchObject({
                    name: "id",
                    type: {
                        kind: "NON_NULL",
                        ofType: {
                            name: "ID"
                        }
                    }
                });

                const dataArg = field.args.find(arg => arg.name === "data");
                expect(dataArg).toMatchObject({
                    name: "data",
                    type: {
                        name: null,
                        kind: "NON_NULL",
                        ofType: {
                            name: `CmsManage${modelName}Input`
                        }
                    }
                });

                // return type
                expect(field.type).toMatchObject({
                    name: `CmsManage${modelName}Response`,
                    kind: "OBJECT",
                    ofType: null
                });
            });
            test(`delete a model entry`, async () => {
                const { data } = await graphql(testing.schema, schemaTypes, {}, testing.context);
                const CmsManageMutation = data.__schema.types.find(
                    type => type.name === "CmsManageMutation"
                );
                expect(CmsManageMutation).toBeTruthy();

                const field = CmsManageMutation.fields.find(f => f.name === `delete${modelName}`);
                expect(field).toBeTruthy();

                const idArg = field.args.find(arg => arg.name === "id");
                expect(idArg).toMatchObject({
                    name: "id",
                    type: {
                        kind: "NON_NULL",
                        ofType: {
                            name: "ID"
                        }
                    }
                });

                // return type
                expect(field.type).toMatchObject({
                    name: `CmsDeleteResponse`,
                    kind: "OBJECT",
                    ofType: null
                });
            });
        });
    });
};
