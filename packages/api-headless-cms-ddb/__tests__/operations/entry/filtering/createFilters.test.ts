import { createExpressions, Expression } from "~/operations/entry/filtering/createExpressions";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createModel } from "../../helpers/createModel";
import { createFields } from "~/operations/entry/filtering/createFields";
import { Field } from "~/operations/entry/filtering/types";
import { createPluginsContainer } from "../../helpers/pluginsContainer";

describe("create filters from where conditions", () => {
    let plugins: PluginsContainer;
    let model: CmsModel;
    let fields: Record<string, Field>;

    beforeEach(() => {
        plugins = createPluginsContainer();
        model = createModel();
        fields = createFields({
            plugins,
            fields: model.fields
        });
    });

    it("should create simple, non-nested, filters", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                id_gte: 500,
                title_not_contains: "webiny",
                priority_in: [2],
                createdBy: "123#admin",
                parent: {
                    id_in: ["parentIdNumber"]
                },
                authors: {
                    entryId_in: ["authorId1", "authorId2"]
                }
            }
        });

        const expected: Expression = {
            condition: "AND",
            expressions: [],
            filters: [
                {
                    compareValue: 500,
                    field: expect.objectContaining({
                        fieldId: "id"
                    }),
                    plugin: expect.objectContaining({
                        _params: {
                            matches: expect.any(Function),
                            operation: "gte"
                        },
                        name: "dynamodb.value.filter.gte"
                    }),
                    negate: false,
                    fieldPathId: "id",
                    path: "id",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: "webiny",
                    field: expect.objectContaining({
                        fieldId: "title"
                    }),
                    plugin: expect.objectContaining({
                        _params: {
                            matches: expect.any(Function),
                            operation: "contains"
                        },
                        name: "dynamodb.value.filter.contains"
                    }),
                    negate: true,
                    fieldPathId: "title",
                    path: "values.title",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: [2],
                    field: expect.objectContaining({
                        fieldId: "priority"
                    }),
                    plugin: expect.objectContaining({
                        _params: {
                            matches: expect.any(Function),
                            operation: "in"
                        },
                        name: "dynamodb.value.filter.in"
                    }),
                    negate: false,
                    fieldPathId: "priority",
                    path: "values.priority",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: "123#admin",
                    field: expect.objectContaining({
                        fieldId: "createdBy"
                    }),
                    plugin: expect.objectContaining({
                        _params: {
                            matches: expect.any(Function),
                            operation: "eq"
                        },
                        name: "dynamodb.value.filter.eq"
                    }),
                    negate: false,
                    fieldPathId: "createdBy",
                    path: "createdBy.id",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: ["parentIdNumber"],
                    field: expect.objectContaining({
                        fieldId: "parent"
                    }),
                    plugin: expect.objectContaining({
                        _params: {
                            matches: expect.any(Function),
                            operation: "in"
                        },
                        name: "dynamodb.value.filter.in"
                    }),
                    negate: false,
                    fieldPathId: "parent",
                    path: "values.parent.id",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: ["authorId1", "authorId2"],
                    field: expect.objectContaining({
                        fieldId: "authors"
                    }),
                    plugin: expect.objectContaining({
                        _params: {
                            matches: expect.any(Function),
                            operation: "in"
                        },
                        name: "dynamodb.value.filter.in"
                    }),
                    negate: false,
                    fieldPathId: "authors",
                    path: "values.authors.entryId",
                    transformValue: expect.any(Function)
                }
            ]
        };

        expect(result).toEqual(expected);
    });

    it("should create complex nested filters", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                options: {
                    keys_in: ["key#1", "key#2", "key#3"],
                    optionId_gte: 250
                }
            }
        });

        const expected: Expression = {
            condition: "AND",
            expressions: [],
            filters: [
                {
                    compareValue: ["key#1", "key#2", "key#3"],
                    field: expect.objectContaining({
                        fieldId: "keys"
                    }),
                    plugin: expect.objectContaining({
                        _params: {
                            matches: expect.any(Function),
                            operation: "in"
                        },
                        name: "dynamodb.value.filter.in"
                    }),
                    negate: false,
                    fieldPathId: "options.keys",
                    path: "values.options.keys",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: 250,
                    field: expect.objectContaining({
                        fieldId: "optionId"
                    }),
                    plugin: expect.objectContaining({
                        _params: {
                            matches: expect.any(Function),
                            operation: "gte"
                        },
                        name: "dynamodb.value.filter.gte"
                    }),
                    negate: false,
                    fieldPathId: "options.optionId",
                    path: "values.options.optionId",
                    transformValue: expect.any(Function)
                }
            ]
        };

        expect(result).toEqual(expected);
    });
});
