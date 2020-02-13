import { graphql } from "graphql";
import { upperFirst } from "lodash";
import pluralize from "pluralize";
import contentModels from "../data/contentModels";

export default ({ setupSchema, schemaTypesQuery }) => {
    describe("cmsRead typeDefs", () => {
        const contentModel = contentModels[0];
        const modelName = upperFirst(contentModel.modelId);

        test("get a single model entry", async () => {
            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, schemaTypesQuery, {}, context);
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
                    name: null,
                    kind: "NON_NULL",
                    ofType: {
                        name: `CmsRead${modelName}GetWhereInput`
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
            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, schemaTypesQuery, {}, context);
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
                    name: `CmsRead${modelName}ListWhereInput`,
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
                        name: `CmsRead${modelName}ListSorter`
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
};