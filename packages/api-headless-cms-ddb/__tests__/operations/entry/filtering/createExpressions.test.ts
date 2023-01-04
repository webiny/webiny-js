import { createExpressions, Expression } from "~/operations/entry/filtering/createExpressions";
import { PluginsContainer } from "@webiny/plugins";
import { Field } from "~/operations/entry/filtering/types";
import { createPluginsContainer } from "../../helpers/pluginsContainer";
import { createFields } from "./mocks/fields";

describe("create expressions from where conditions", () => {
    let plugins: PluginsContainer;
    let fields: Record<string, Field>;

    beforeEach(() => {
        plugins = createPluginsContainer();
        fields = createFields({
            plugins
        });
    });

    it("should convert simple root level where into expression", () => {
        const rootWhereResult = createExpressions({
            plugins,
            fields,
            where: {
                title_contains: "some value",
                date_gte: "2023-01-01",
                id_not_in: ["1", "2", "3"]
            }
        });

        const expectedRootWhere: Expression[] = [
            {
                condition: "AND",
                filters: [
                    {
                        fieldPathId: "title",
                        negate: false,
                        path: "values.title",
                        compareValue: "some value",
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    },
                    {
                        fieldPathId: "date",
                        negate: false,
                        path: "values.date",
                        compareValue: "2023-01-01",
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    },
                    {
                        fieldPathId: "id",
                        negate: true,
                        path: "id",
                        compareValue: ["1", "2", "3"],
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    }
                ]
            }
        ];

        expect(rootWhereResult).toEqual(expectedRootWhere);
    });

    it("should convert root level AND where into expression", async () => {
        const andWhereResult = createExpressions({
            plugins,
            fields,
            where: {
                AND: [
                    {
                        title_contains: "some value",
                        date_gte: "2023-01-01",
                        id_not_in: ["1", "2", "3"]
                    }
                ]
            }
        });

        const expectedAndWhere: Expression[] = [
            {
                condition: "AND",
                filters: [
                    {
                        fieldPathId: "title",
                        negate: false,
                        path: "values.title",
                        compareValue: "some value",
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    },
                    {
                        fieldPathId: "date",
                        negate: false,
                        path: "values.date",
                        compareValue: "2023-01-01",
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    },
                    {
                        fieldPathId: "id",
                        negate: true,
                        path: "id",
                        compareValue: ["1", "2", "3"],
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    }
                ]
            }
        ];

        expect(andWhereResult).toEqual(expectedAndWhere);

        const rootWithAndWhereResult = createExpressions({
            plugins,
            fields,
            where: {
                isMarried_not: true,
                AND: [
                    {
                        title_contains: "some value",
                        date_gte: "2023-01-01",
                        id_not_in: ["1", "2", "3"]
                    }
                ],
                price_gte: 100
            }
        });

        const expectedRootWithAndWhere: Expression[] = [
            {
                condition: "AND",
                filters: [
                    {
                        fieldPathId: "title",
                        negate: false,
                        path: "values.title",
                        compareValue: "some value",
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    },
                    {
                        fieldPathId: "date",
                        negate: false,
                        path: "values.date",
                        compareValue: "2023-01-01",
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    },
                    {
                        fieldPathId: "id",
                        negate: true,
                        path: "id",
                        compareValue: ["1", "2", "3"],
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    },
                    {
                        fieldPathId: "isMarried",
                        negate: true,
                        path: "values.isMarried",
                        compareValue: true,
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    },
                    {
                        fieldPathId: "price",
                        negate: false,
                        path: "values.price",
                        compareValue: 100,
                        transformValue: expect.any(Function),
                        plugin: expect.any(Object),
                        field: expect.any(Object)
                    }
                ]
            }
        ];

        expect(rootWithAndWhereResult).toEqual(expectedRootWithAndWhere);
    });
});
