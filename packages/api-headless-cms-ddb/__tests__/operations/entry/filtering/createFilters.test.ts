import { beforeEach, describe, expect, it } from "vitest";
import {
    createExpressions,
    type Expression,
    createFields,
    ValueFilterRegistry,
    type Field
} from "@webiny/db-utils";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createModel } from "../../helpers/createModel";
import { createPluginsContainer } from "../../helpers/pluginsContainer";
import { createTestContainer } from "../../helpers/createTestContainer";

describe("create filters from where conditions", () => {
    let plugins: PluginsContainer;
    let model: CmsModel;
    let fields: Record<string, Field>;
    let valueFilterRegistry: ValueFilterRegistry.Interface;

    beforeEach(() => {
        plugins = createPluginsContainer();
        const container = createTestContainer();
        valueFilterRegistry = container.resolve(ValueFilterRegistry);
        model = createModel();
        fields = createFields({
            plugins,
            fields: model.fields
        });
    });

    it("it should create simple filter by system field", () => {
        const result = createExpressions({
            plugins,
            valueFilterRegistry,
            fields,
            where: {
                id: "someId"
            }
        });
        const expected: Expression = {
            condition: "AND",
            expressions: [],
            filters: [
                {
                    compareValue: "someId",
                    field: expect.objectContaining({
                        fieldId: "id"
                    }),
                    filter: expect.objectContaining({
                        operation: "eq"
                    }),
                    negate: false,
                    fieldPathId: "id",
                    path: "id",
                    transformValue: expect.any(Function)
                }
            ]
        };
        expect(result).toEqual(expected);
    });

    it("should create simple filter by content field", () => {
        const result = createExpressions({
            plugins,
            valueFilterRegistry,
            fields,
            where: {
                values: {
                    title: "someTitle"
                }
            }
        });
        const expected: Expression = {
            condition: "AND",
            expressions: [],
            filters: [
                {
                    compareValue: "someTitle",
                    field: expect.objectContaining({
                        fieldId: "title",
                        parents: [
                            {
                                fieldId: "values",
                                list: false
                            }
                        ]
                    }),
                    filter: expect.objectContaining({
                        operation: "eq"
                    }),
                    negate: false,
                    fieldPathId: "values.title",
                    path: "values.title",
                    transformValue: expect.any(Function)
                }
            ]
        };
        expect(result).toEqual(expected);
    });

    it("should create simple, non-nested, filters", async () => {
        const result = createExpressions({
            plugins,
            valueFilterRegistry,
            fields,
            where: {
                id_gte: 500,
                createdBy: "123#admin",
                values: {
                    title_not_contains: "webiny",
                    priority_in: [2],
                    parent: {
                        id_in: ["parentIdNumber"]
                    },
                    authors: {
                        entryId_in: ["authorId1", "authorId2"]
                    }
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
                    filter: expect.objectContaining({
                        operation: "gte"
                    }),
                    negate: false,
                    fieldPathId: "id",
                    path: "id",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: "123#admin",
                    field: expect.objectContaining({
                        fieldId: "createdBy"
                    }),
                    filter: expect.objectContaining({
                        operation: "eq"
                    }),
                    negate: false,
                    fieldPathId: "createdBy",
                    path: "createdBy.id",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: "webiny",
                    field: expect.objectContaining({
                        fieldId: "title"
                    }),
                    filter: expect.objectContaining({
                        operation: "contains"
                    }),
                    negate: true,
                    fieldPathId: "values.title",
                    path: "values.title",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: [2],
                    field: expect.objectContaining({
                        fieldId: "priority"
                    }),
                    filter: expect.objectContaining({
                        operation: "in"
                    }),
                    negate: false,
                    fieldPathId: "values.priority",
                    path: "values.priority",
                    transformValue: expect.any(Function)
                },

                {
                    compareValue: ["parentIdNumber"],
                    field: expect.objectContaining({
                        fieldId: "parent"
                    }),
                    filter: expect.objectContaining({
                        operation: "in"
                    }),
                    negate: false,
                    fieldPathId: "values.parent",
                    path: "values.parent.id",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: ["authorId1", "authorId2"],
                    field: expect.objectContaining({
                        fieldId: "authors"
                    }),
                    filter: expect.objectContaining({
                        operation: "in"
                    }),
                    negate: false,
                    fieldPathId: "values.authors",
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
            valueFilterRegistry,
            fields,
            where: {
                values: {
                    options: {
                        keys_in: ["key#1", "key#2", "key#3"],
                        optionId_gte: 250
                    }
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
                    filter: expect.objectContaining({
                        operation: "in"
                    }),
                    negate: false,
                    fieldPathId: "values.options.keys",
                    path: "values.options.keys",
                    transformValue: expect.any(Function)
                },
                {
                    compareValue: 250,
                    field: expect.objectContaining({
                        fieldId: "optionId"
                    }),
                    filter: expect.objectContaining({
                        operation: "gte"
                    }),
                    negate: false,
                    fieldPathId: "values.options.optionId",
                    path: "values.options.optionId",
                    transformValue: expect.any(Function)
                }
            ]
        };

        expect(result).toEqual(expected);
    });
});
