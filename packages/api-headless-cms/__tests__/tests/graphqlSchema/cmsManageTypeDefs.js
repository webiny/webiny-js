import { graphql } from "graphql";
import { upperFirst } from "lodash";
import pluralize from "pluralize";
import contentModels from "../data/contentModels";

export default ({ setupSchema, schemaTypesQuery } ) => {
    describe("cmsManage typeDefs", () => {
        const contentModel = contentModels[0];
        const modelName = upperFirst(contentModel.modelId);

        test(`get a model entry`, async () => {
            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, schemaTypesQuery, {}, context);
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

            const whereArg = field.args.find(arg => arg.name === "where");
            expect(whereArg).toMatchObject({
                name: "where",
                type: {
                    name: null,
                    kind: "NON_NULL",
                    ofType: {
                        name: `CmsManage${modelName}GetWhereInput`
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

        test(`list model entries`, async () => {
            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, schemaTypesQuery, {}, context);
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
                    name: `CmsManage${modelName}ListWhereInput`,
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
                        name: `CmsManage${modelName}ListSorter`
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
            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, schemaTypesQuery, {}, context);
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
            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, schemaTypesQuery, {}, context);
            const CmsManageMutation = data.__schema.types.find(
                type => type.name === "CmsManageMutation"
            );
            expect(CmsManageMutation).toBeTruthy();

            const field = CmsManageMutation.fields.find(f => f.name === `update${modelName}`);
            expect(field).toBeTruthy();

            const whereArg = field.args.find(arg => arg.name === "where");
            expect(whereArg).toMatchObject({
                name: "where",
                type: {
                    name: null,
                    kind: "NON_NULL",
                    ofType: {
                        name: `CmsManage${modelName}UpdateWhereInput`
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
            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, schemaTypesQuery, {}, context);
            const CmsManageMutation = data.__schema.types.find(
                type => type.name === "CmsManageMutation"
            );
            expect(CmsManageMutation).toBeTruthy();

            const field = CmsManageMutation.fields.find(f => f.name === `delete${modelName}`);
            expect(field).toBeTruthy();

            const whereArg = field.args.find(arg => arg.name === "where");
            expect(whereArg).toMatchObject({
                name: "where",
                type: {
                    name: null,
                    kind: "NON_NULL",
                    ofType: {
                        name: `CmsManage${modelName}DeleteWhereInput`
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
};