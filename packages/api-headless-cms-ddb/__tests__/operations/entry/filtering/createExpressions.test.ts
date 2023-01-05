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
        const result = createExpressions({
            plugins,
            fields,
            where: {
                title_contains: "some value",
                date_gte: "2023-01-01",
                id_not_in: ["1", "2", "3"]
            }
        });

        const expected: Expression[] = [
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

        expect(result).toEqual(expected);
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
                expressions: [
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
                expressions: [
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
                ]
            },
            {
                condition: "AND",
                filters: [
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

    it("should convert nested AND where to expression", async () => {
        const oneLevelAndWhereResult = createExpressions({
            plugins,
            fields,
            where: {
                isMarried_not: true,
                AND: [
                    {
                        AND: [
                            {
                                price_lte: 500
                            }
                        ]
                    }
                ],
                price_gte: 100
            }
        });

        const expectedOneLevelAndWhereResult: Expression[] = [
            {
                condition: "AND",
                expressions: [
                    {
                        condition: "AND",
                        expressions: [
                            {
                                condition: "AND",
                                filters: [
                                    {
                                        fieldPathId: "price",
                                        negate: false,
                                        path: "values.price",
                                        compareValue: 500,
                                        transformValue: expect.any(Function),
                                        plugin: expect.any(Object),
                                        field: expect.any(Object)
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                condition: "AND",
                filters: [
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

        expect(oneLevelAndWhereResult).toEqual(expectedOneLevelAndWhereResult);

        const twoLevelAndWhereResult = createExpressions({
            plugins,
            fields,
            where: {
                isMarried_not: true,
                AND: [
                    {
                        date_gt: "2023-01-01"
                    },
                    {
                        AND: [
                            {
                                price_lte: 500
                            },
                            {
                                availableOn_not: null,
                                AND: [
                                    {
                                        title_contains: "nested"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                price_gte: 100
            }
        });

        const expectedTwoLevelAndWhereResult: Expression[] = [
            {
                condition: "AND",
                expressions: [
                    {
                        condition: "AND",
                        filters: [
                            {
                                fieldPathId: "date",
                                negate: false,
                                path: "values.date",
                                compareValue: "2023-01-01",
                                transformValue: expect.any(Function),
                                plugin: expect.any(Object),
                                field: expect.any(Object)
                            }
                        ]
                    },
                    {
                        condition: "AND",
                        expressions: [
                            {
                                condition: "AND",
                                filters: [
                                    {
                                        fieldPathId: "price",
                                        negate: false,
                                        path: "values.price",
                                        compareValue: 500,
                                        transformValue: expect.any(Function),
                                        plugin: expect.any(Object),
                                        field: expect.any(Object)
                                    }
                                ]
                            },
                            {
                                condition: "AND",
                                expressions: [
                                    {
                                        condition: "AND",
                                        filters: [
                                            {
                                                fieldPathId: "title",
                                                negate: false,
                                                path: "values.title",
                                                compareValue: "nested",
                                                transformValue: expect.any(Function),
                                                plugin: expect.any(Object),
                                                field: expect.any(Object)
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                condition: "AND",
                                filters: [
                                    {
                                        fieldPathId: "availableOn",
                                        negate: true,
                                        path: "values.availableOn",
                                        compareValue: null,
                                        transformValue: expect.any(Function),
                                        plugin: expect.any(Object),
                                        field: expect.any(Object)
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                condition: "AND",
                filters: [
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

        expect(twoLevelAndWhereResult).toEqual(expectedTwoLevelAndWhereResult);
    });

    it("should convert root level OR into expression", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        title_contains: "some value",
                        date_gte: "2023-01-01",
                        id_not_in: ["1", "2", "3"]
                    }
                ]
            }
        });

        const expected: Expression[] = [
            {
                condition: "OR",
                expressions: [
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
                ]
            }
        ];

        expect(result).toEqual(expected);
    });

    it("should convert nested OR into expressions", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        title_contains: "some value",
                        date_gte: "2023-01-01",
                        id_not_in: ["1", "2", "3"]
                    },
                    {
                        OR: [
                            {
                                title_contains: "some other value"
                            }
                        ]
                    }
                ]
            }
        });

        const expected: Expression[] = [
            {
                condition: "OR",
                expressions: [
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
                    },
                    {
                        condition: "OR",
                        expressions: [
                            {
                                condition: "AND",
                                filters: [
                                    {
                                        fieldPathId: "title",
                                        negate: false,
                                        path: "values.title",
                                        compareValue: "some other value",
                                        transformValue: expect.any(Function),
                                        plugin: expect.any(Object),
                                        field: expect.any(Object)
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];

        expect(result).toEqual(expected);
    });
});
