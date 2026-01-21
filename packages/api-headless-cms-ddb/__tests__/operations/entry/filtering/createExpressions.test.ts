import { beforeEach, describe, expect, it } from "vitest";
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
                values: {
                    title_contains: "some value",
                    date_gte: "2023-01-01"
                },
                id_not_in: ["1", "2", "3"]
            }
        });

        const expected: Expression = {
            condition: "AND",
            expressions: [],
            filters: [
                {
                    fieldPathId: "values.title",
                    negate: false,
                    path: "values.title",
                    compareValue: "some value",
                    transformValue: expect.any(Function),
                    plugin: expect.any(Object),
                    field: expect.any(Object)
                },
                {
                    fieldPathId: "values.date",
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
        };

        expect(result).toEqual(expected);
    });

    it("should convert root level AND where into expression", async () => {
        const andWhereResult = createExpressions({
            plugins,
            fields,
            where: {
                AND: [
                    {
                        values: {
                            title_contains: "some value",
                            date_gte: "2023-01-01"
                        },
                        id_not_in: ["1", "2", "3"]
                    }
                ]
            }
        });

        const expectedAndWhere: Expression = {
            condition: "AND",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        },
                        {
                            fieldPathId: "values.date",
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
        };

        expect(andWhereResult).toEqual(expectedAndWhere);

        const rootWithAndWhereResult = createExpressions({
            plugins,
            fields,
            where: {
                values: {
                    isMarried_not: true,
                    price_gte: 100
                },
                AND: [
                    {
                        values: {
                            title_contains: "some value",
                            date_gte: "2023-01-01"
                        },
                        id_not_in: ["1", "2", "3"]
                    }
                ]
            }
        });

        const expectedRootWithAndWhere: Expression = {
            condition: "AND",
            filters: [
                {
                    fieldPathId: "values.isMarried",
                    negate: true,
                    path: "values.isMarried",
                    compareValue: true,
                    transformValue: expect.any(Function),
                    plugin: expect.any(Object),
                    field: expect.any(Object)
                },
                {
                    fieldPathId: "values.price",
                    negate: false,
                    path: "values.price",
                    compareValue: 100,
                    transformValue: expect.any(Function),
                    plugin: expect.any(Object),
                    field: expect.any(Object)
                }
            ],
            expressions: [
                {
                    condition: "AND",
                    filters: [],
                    expressions: [
                        {
                            condition: "AND",
                            expressions: [],
                            filters: [
                                {
                                    fieldPathId: "values.title",
                                    negate: false,
                                    path: "values.title",
                                    compareValue: "some value",
                                    transformValue: expect.any(Function),
                                    plugin: expect.any(Object),
                                    field: expect.any(Object)
                                },
                                {
                                    fieldPathId: "values.date",
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
            ]
        };

        expect(rootWithAndWhereResult).toEqual(expectedRootWithAndWhere);
    });

    it("should convert nested AND where to expression", async () => {
        const oneLevelAndWhereResult = createExpressions({
            plugins,
            fields,
            where: {
                values: {
                    isMarried_not: true,
                    price_gte: 100
                },
                AND: [
                    {
                        AND: [
                            {
                                values: {
                                    price_lte: 500
                                }
                            }
                        ]
                    }
                ]
            }
        });

        const expectedOneLevelAndWhereResult: Expression = {
            condition: "AND",
            filters: [
                {
                    fieldPathId: "values.isMarried",
                    negate: true,
                    path: "values.isMarried",
                    compareValue: true,
                    transformValue: expect.any(Function),
                    plugin: expect.any(Object),
                    field: expect.any(Object)
                },
                {
                    fieldPathId: "values.price",
                    negate: false,
                    path: "values.price",
                    compareValue: 100,
                    transformValue: expect.any(Function),
                    plugin: expect.any(Object),
                    field: expect.any(Object)
                }
            ],
            expressions: [
                {
                    condition: "AND",
                    filters: [],
                    expressions: [
                        {
                            condition: "AND",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    filters: [],
                                    expressions: [
                                        {
                                            condition: "AND",
                                            filters: [
                                                {
                                                    fieldPathId: "values.price",
                                                    negate: false,
                                                    path: "values.price",
                                                    compareValue: 500,
                                                    transformValue: expect.any(Function),
                                                    plugin: expect.any(Object),
                                                    field: expect.any(Object)
                                                }
                                            ],
                                            expressions: []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        expect(oneLevelAndWhereResult).toEqual(expectedOneLevelAndWhereResult);

        const twoLevelAndWhereResult = createExpressions({
            plugins,
            fields,
            where: {
                values: {
                    isMarried_not: true,
                    price_gte: 100
                },
                AND: [
                    {
                        values: {
                            date_gt: "2023-01-01"
                        }
                    },
                    {
                        AND: [
                            {
                                values: {
                                    price_lte: 500
                                }
                            },
                            {
                                values: {
                                    availableOn_not: null
                                },
                                AND: [
                                    {
                                        values: {
                                            title_contains: "nested"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        });

        const expectedTwoLevelAndWhereResult: Expression = {
            condition: "AND",
            filters: [
                {
                    fieldPathId: "values.isMarried",
                    negate: true,
                    path: "values.isMarried",
                    compareValue: true,
                    transformValue: expect.any(Function),
                    plugin: expect.any(Object),
                    field: expect.any(Object)
                },
                {
                    fieldPathId: "values.price",
                    negate: false,
                    path: "values.price",
                    compareValue: 100,
                    transformValue: expect.any(Function),
                    plugin: expect.any(Object),
                    field: expect.any(Object)
                }
            ],
            expressions: [
                {
                    condition: "AND",
                    filters: [],
                    expressions: [
                        {
                            condition: "AND",
                            expressions: [],
                            filters: [
                                {
                                    fieldPathId: "values.date",
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
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    filters: [],
                                    expressions: [
                                        {
                                            condition: "AND",
                                            expressions: [],
                                            filters: [
                                                {
                                                    fieldPathId: "values.price",
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
                                            filters: [
                                                {
                                                    fieldPathId: "values.availableOn",
                                                    negate: true,
                                                    path: "values.availableOn",
                                                    compareValue: null,
                                                    transformValue: expect.any(Function),
                                                    plugin: expect.any(Object),
                                                    field: expect.any(Object)
                                                }
                                            ],
                                            expressions: [
                                                {
                                                    condition: "AND",
                                                    filters: [],
                                                    expressions: [
                                                        {
                                                            condition: "AND",
                                                            filters: [
                                                                {
                                                                    fieldPathId: "values.title",
                                                                    negate: false,
                                                                    path: "values.title",
                                                                    compareValue: "nested",
                                                                    transformValue:
                                                                        expect.any(Function),
                                                                    plugin: expect.any(Object),
                                                                    field: expect.any(Object)
                                                                }
                                                            ],
                                                            expressions: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        expect(twoLevelAndWhereResult).toEqual(expectedTwoLevelAndWhereResult);
    });

    it("should convert root level OR into expression", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        values: {
                            title_contains: "some value",
                            date_gte: "2023-01-01"
                        },
                        id_not_in: ["1", "2", "3"]
                    }
                ]
            }
        });

        const expected: Expression = {
            condition: "OR",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        },
                        {
                            fieldPathId: "values.date",
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
        };

        expect(result).toEqual(expected);
    });

    it("should convert one level OR into expressions", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        values: {
                            title_contains: "some value",
                            title_not_contains: "unwanted value"
                        }
                    },
                    {
                        id_not_in: ["1", "2", "3"]
                    },
                    {
                        values: {
                            date_gte: "2023-01-01"
                        }
                    }
                ]
            }
        });

        const expected: Expression = {
            condition: "OR",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        },
                        {
                            fieldPathId: "values.title",
                            negate: true,
                            path: "values.title",
                            compareValue: "unwanted value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ]
                },
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
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
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.date",
                            negate: false,
                            path: "values.date",
                            compareValue: "2023-01-01",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ]
                }
            ]
        };

        expect(result).toEqual(expected);
    });

    it("should convert two levels OR into expressions", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        values: {
                            title_contains: "some value",
                            date_gte: "2023-01-01"
                        }
                    },
                    {
                        id_not_in: ["1", "2", "3"]
                    },
                    {
                        OR: [
                            {
                                values: {
                                    title_contains: "some other value"
                                }
                            }
                        ]
                    }
                ]
            }
        });

        const expected: Expression = {
            condition: "OR",
            filters: [],
            expressions: [
                {
                    expressions: [],
                    condition: "AND",
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        },
                        {
                            fieldPathId: "values.date",
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
                    expressions: [],
                    filters: [
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
                    condition: "AND",
                    filters: [],
                    expressions: [
                        {
                            condition: "OR",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.title",
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
            ]
        };

        expect(result).toEqual(expected);
    });

    it("should convert two levels OR into expressions - sibling OR", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        values: {
                            title_contains: "some value",
                            date_gte: "2023-01-01"
                        }
                    },
                    {
                        id_not_in: ["1", "2", "3"],

                        OR: [
                            {
                                values: {
                                    price_gte: 100
                                }
                            }
                        ]
                    },
                    {
                        OR: [
                            {
                                values: {
                                    title_contains: "some other value"
                                }
                            }
                        ]
                    }
                ]
            }
        });

        const expected: Expression = {
            condition: "OR",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        },
                        {
                            fieldPathId: "values.date",
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
                    filters: [
                        {
                            fieldPathId: "id",
                            negate: true,
                            path: "id",
                            compareValue: ["1", "2", "3"],
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ],
                    expressions: [
                        {
                            condition: "OR",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.price",
                                            negate: false,
                                            path: "values.price",
                                            compareValue: 100,
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
                    filters: [],
                    expressions: [
                        {
                            condition: "OR",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.title",
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
            ]
        };

        expect(result).toEqual(expected);
    });

    it("should convert three levels OR into expressions", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        values: {
                            title_contains: "some value"
                        }
                    },
                    {
                        id_not_in: ["1", "2", "3"]
                    },
                    {
                        values: {
                            date_gte: "2023-01-01"
                        }
                    },
                    {
                        OR: [
                            {
                                values: {
                                    title_contains: "some other value"
                                }
                            },
                            {
                                OR: [
                                    {
                                        values: {
                                            price_lte: 500
                                        }
                                    },
                                    {
                                        values: {
                                            price_gte: 100,
                                            price_lte: 1000
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        });

        const expected: Expression = {
            condition: "OR",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ]
                },
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
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
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.date",
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
                    filters: [],
                    expressions: [
                        {
                            condition: "OR",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.title",
                                            negate: false,
                                            path: "values.title",
                                            compareValue: "some other value",
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        }
                                    ]
                                },
                                {
                                    condition: "AND",
                                    filters: [],
                                    expressions: [
                                        {
                                            condition: "OR",
                                            filters: [],
                                            expressions: [
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.price",
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
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 100,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        },
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 1000,
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
                            ]
                        }
                    ]
                }
            ]
        };

        expect(result).toEqual(expected);
    });

    it("should convert four levels OR into expressions", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        values: {
                            title_contains: "some value"
                        }
                    },
                    {
                        id_not_in: ["1", "2", "3"]
                    },
                    {
                        values: {
                            date_gte: "2023-01-01"
                        }
                    },
                    {
                        OR: [
                            {
                                values: {
                                    title_contains: "some other value"
                                }
                            },
                            {
                                OR: [
                                    {
                                        values: {
                                            price_lte: 500
                                        },
                                        OR: [
                                            {
                                                values: {
                                                    title_contains: "some unknown value"
                                                }
                                            },
                                            {
                                                values: {
                                                    title_contains: "some even more unknown value"
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        values: {
                                            price_gte: 100,
                                            price_lte: 1000
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        });

        const expected: Expression = {
            condition: "OR",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ]
                },
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
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
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.date",
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
                    filters: [],
                    expressions: [
                        {
                            condition: "OR",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.title",
                                            negate: false,
                                            path: "values.title",
                                            compareValue: "some other value",
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        }
                                    ]
                                },
                                {
                                    condition: "AND",
                                    filters: [],
                                    expressions: [
                                        {
                                            condition: "OR",
                                            filters: [],
                                            expressions: [
                                                {
                                                    condition: "AND",
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 500,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        }
                                                    ],
                                                    expressions: [
                                                        {
                                                            condition: "OR",
                                                            filters: [],
                                                            expressions: [
                                                                {
                                                                    condition: "AND",
                                                                    expressions: [],
                                                                    filters: [
                                                                        {
                                                                            fieldPathId:
                                                                                "values.title",
                                                                            negate: false,
                                                                            path: "values.title",
                                                                            compareValue:
                                                                                "some unknown value",
                                                                            transformValue:
                                                                                expect.any(
                                                                                    Function
                                                                                ),
                                                                            plugin: expect.any(
                                                                                Object
                                                                            ),
                                                                            field: expect.any(
                                                                                Object
                                                                            )
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    condition: "AND",
                                                                    expressions: [],
                                                                    filters: [
                                                                        {
                                                                            fieldPathId:
                                                                                "values.title",
                                                                            negate: false,
                                                                            path: "values.title",
                                                                            compareValue:
                                                                                "some even more unknown value",
                                                                            transformValue:
                                                                                expect.any(
                                                                                    Function
                                                                                ),
                                                                            plugin: expect.any(
                                                                                Object
                                                                            ),
                                                                            field: expect.any(
                                                                                Object
                                                                            )
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 100,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        },
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 1000,
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
                            ]
                        }
                    ]
                }
            ]
        };

        expect(result).toEqual(expected);
    });

    it("should convert a simple root level AND and OR into expression", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                values: {
                    price_gte: 100
                },
                OR: [
                    {
                        values: {
                            title_contains: "some value"
                        }
                    },
                    {
                        values: {
                            title_contains: "some other value"
                        }
                    }
                ]
            }
        });

        const expected: Expression = {
            condition: "AND",
            filters: [
                {
                    fieldPathId: "values.price",
                    negate: false,
                    path: "values.price",
                    compareValue: 100,
                    transformValue: expect.any(Function),
                    plugin: expect.any(Object),
                    field: expect.any(Object)
                }
            ],
            expressions: [
                {
                    condition: "OR",
                    filters: [],
                    expressions: [
                        {
                            condition: "AND",
                            expressions: [],
                            filters: [
                                {
                                    fieldPathId: "values.title",
                                    negate: false,
                                    path: "values.title",
                                    compareValue: "some value",
                                    transformValue: expect.any(Function),
                                    plugin: expect.any(Object),
                                    field: expect.any(Object)
                                }
                            ]
                        },
                        {
                            condition: "AND",
                            expressions: [],
                            filters: [
                                {
                                    fieldPathId: "values.title",
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
        };

        expect(result).toEqual(expected);
    });

    it("should convert complex OR / AND where into expression", async () => {
        const rootOrResult = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        values: {
                            title_contains: "some value"
                        }
                    },
                    {
                        values: {
                            title_contains: "some other value"
                        }
                    },
                    {
                        OR: [
                            {
                                values: {
                                    title_contains: "some level #3 value",
                                    price_gte: 100
                                }
                            },
                            {
                                values: {
                                    title_contains: "some level #3.1 value"
                                },
                                OR: [
                                    {
                                        values: {
                                            price_gte: 110,
                                            price_lte: 490
                                        }
                                    },
                                    {
                                        values: {
                                            title_contains: "some level #4 value"
                                        }
                                    }
                                ]
                            }
                        ],
                        AND: [
                            {
                                values: {
                                    price_gte: 100,
                                    price_lte: 500
                                }
                            },
                            {
                                values: {
                                    isMarried: true
                                },
                                OR: [
                                    {
                                        values: {
                                            price_gte: 120,
                                            price_lte: 480
                                        }
                                    },
                                    {
                                        values: {
                                            title_contains: "some level #4 value"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        });

        const rootOrExpected: Expression = {
            condition: "OR",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ]
                },
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some other value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ]
                },
                {
                    condition: "AND",
                    filters: [],
                    expressions: [
                        {
                            condition: "OR",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.title",
                                            negate: false,
                                            path: "values.title",
                                            compareValue: "some level #3 value",
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        },
                                        {
                                            fieldPathId: "values.price",
                                            negate: false,
                                            path: "values.price",
                                            compareValue: 100,
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        }
                                    ]
                                },
                                {
                                    condition: "AND",
                                    filters: [
                                        {
                                            fieldPathId: "values.title",
                                            negate: false,
                                            path: "values.title",
                                            compareValue: "some level #3.1 value",
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        }
                                    ],
                                    expressions: [
                                        {
                                            condition: "OR",
                                            filters: [],
                                            expressions: [
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 110,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        },
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 490,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        }
                                                    ]
                                                },
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.title",
                                                            negate: false,
                                                            path: "values.title",
                                                            compareValue: "some level #4 value",
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
                            ]
                        },
                        {
                            condition: "AND",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.price",
                                            negate: false,
                                            path: "values.price",
                                            compareValue: 100,
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        },
                                        {
                                            fieldPathId: "values.price",
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
                                    filters: [
                                        {
                                            fieldPathId: "values.isMarried",
                                            negate: false,
                                            path: "values.isMarried",
                                            compareValue: true,
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        }
                                    ],
                                    expressions: [
                                        {
                                            condition: "OR",
                                            filters: [],
                                            expressions: [
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 120,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        },
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 480,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        }
                                                    ]
                                                },
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.title",
                                                            negate: false,
                                                            path: "values.title",
                                                            compareValue: "some level #4 value",
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
                            ]
                        }
                    ]
                }
            ]
        };

        expect(rootOrResult).toEqual(rootOrExpected);

        const rootAndResult = createExpressions({
            plugins,
            fields,
            where: {
                AND: [
                    {
                        values: {
                            title_contains: "some value"
                        }
                    },
                    {
                        values: {
                            title_contains: "some other value"
                        }
                    },
                    {
                        OR: [
                            {
                                values: {
                                    title_contains: "some level #3 value",
                                    price_gte: 100
                                }
                            },
                            {
                                values: {
                                    title_contains: "some level #3.1 value"
                                },
                                OR: [
                                    {
                                        values: {
                                            price_gte: 110,
                                            price_lte: 490
                                        }
                                    },
                                    {
                                        values: {
                                            title_contains: "some level #4 value"
                                        }
                                    }
                                ]
                            }
                        ],
                        AND: [
                            {
                                values: {
                                    price_gte: 100,
                                    price_lte: 500
                                }
                            },
                            {
                                values: {
                                    isMarried: true
                                },
                                OR: [
                                    {
                                        values: {
                                            price_gte: 120,
                                            price_lte: 480
                                        }
                                    },
                                    {
                                        values: {
                                            title_contains: "some level #4 value"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        });

        const rootAndExpected: Expression = {
            condition: "AND",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ]
                },
                {
                    condition: "AND",
                    expressions: [],
                    filters: [
                        {
                            fieldPathId: "values.title",
                            negate: false,
                            path: "values.title",
                            compareValue: "some other value",
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ]
                },
                {
                    condition: "AND",
                    filters: [],
                    expressions: [
                        {
                            condition: "OR",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.title",
                                            negate: false,
                                            path: "values.title",
                                            compareValue: "some level #3 value",
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        },
                                        {
                                            fieldPathId: "values.price",
                                            negate: false,
                                            path: "values.price",
                                            compareValue: 100,
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        }
                                    ]
                                },
                                {
                                    condition: "AND",
                                    filters: [
                                        {
                                            fieldPathId: "values.title",
                                            negate: false,
                                            path: "values.title",
                                            compareValue: "some level #3.1 value",
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        }
                                    ],
                                    expressions: [
                                        {
                                            condition: "OR",
                                            filters: [],
                                            expressions: [
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 110,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        },
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 490,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        }
                                                    ]
                                                },
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.title",
                                                            negate: false,
                                                            path: "values.title",
                                                            compareValue: "some level #4 value",
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
                            ]
                        },
                        {
                            condition: "AND",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.price",
                                            negate: false,
                                            path: "values.price",
                                            compareValue: 100,
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        },
                                        {
                                            fieldPathId: "values.price",
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
                                    filters: [
                                        {
                                            fieldPathId: "values.isMarried",
                                            negate: false,
                                            path: "values.isMarried",
                                            compareValue: true,
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        }
                                    ],
                                    expressions: [
                                        {
                                            condition: "OR",
                                            filters: [],
                                            expressions: [
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 120,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        },
                                                        {
                                                            fieldPathId: "values.price",
                                                            negate: false,
                                                            path: "values.price",
                                                            compareValue: 480,
                                                            transformValue: expect.any(Function),
                                                            plugin: expect.any(Object),
                                                            field: expect.any(Object)
                                                        }
                                                    ]
                                                },
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.title",
                                                            negate: false,
                                                            path: "values.title",
                                                            compareValue: "some level #4 value",
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
                            ]
                        }
                    ]
                }
            ]
        };

        expect(rootAndResult).toEqual(rootAndExpected);

        const rootAndOrResult = createExpressions({
            plugins,
            fields,
            where: {
                AND: [
                    {
                        values: {
                            title_contains: "some value"
                        }
                    },
                    {
                        values: {
                            title_contains: "some other value"
                        }
                    },
                    {
                        OR: [
                            {
                                values: {
                                    title_contains: "some level #3 value",
                                    price_gte: 100
                                }
                            },
                            {
                                values: {
                                    title_contains: "some level #3.1 value"
                                },
                                OR: [
                                    {
                                        values: {
                                            price_gte: 110,
                                            price_lte: 490
                                        }
                                    },
                                    {
                                        values: {
                                            title_contains: "some level #4 value"
                                        }
                                    }
                                ]
                            }
                        ],
                        AND: [
                            {
                                values: {
                                    price_gte: 100,
                                    price_lte: 500
                                }
                            },
                            {
                                values: {
                                    isMarried: true
                                },
                                OR: [
                                    {
                                        values: {
                                            price_gte: 120,
                                            price_lte: 480
                                        }
                                    },
                                    {
                                        values: {
                                            title_contains: "some level #4 value"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ],
                OR: [
                    {
                        values: {
                            price_gte: 777
                        }
                    },
                    {
                        values: {
                            isMarried: false
                        }
                    }
                ]
            }
        });

        const rootAndOrExpected: Expression = {
            condition: "AND",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    filters: [],
                    expressions: [
                        {
                            condition: "AND",
                            expressions: [],
                            filters: [
                                {
                                    fieldPathId: "values.title",
                                    negate: false,
                                    path: "values.title",
                                    compareValue: "some value",
                                    transformValue: expect.any(Function),
                                    plugin: expect.any(Object),
                                    field: expect.any(Object)
                                }
                            ]
                        },
                        {
                            condition: "AND",
                            expressions: [],
                            filters: [
                                {
                                    fieldPathId: "values.title",
                                    negate: false,
                                    path: "values.title",
                                    compareValue: "some other value",
                                    transformValue: expect.any(Function),
                                    plugin: expect.any(Object),
                                    field: expect.any(Object)
                                }
                            ]
                        },
                        {
                            condition: "AND",
                            filters: [],
                            expressions: [
                                {
                                    condition: "OR",
                                    filters: [],
                                    expressions: [
                                        {
                                            condition: "AND",
                                            expressions: [],
                                            filters: [
                                                {
                                                    fieldPathId: "values.title",
                                                    negate: false,
                                                    path: "values.title",
                                                    compareValue: "some level #3 value",
                                                    transformValue: expect.any(Function),
                                                    plugin: expect.any(Object),
                                                    field: expect.any(Object)
                                                },
                                                {
                                                    fieldPathId: "values.price",
                                                    negate: false,
                                                    path: "values.price",
                                                    compareValue: 100,
                                                    transformValue: expect.any(Function),
                                                    plugin: expect.any(Object),
                                                    field: expect.any(Object)
                                                }
                                            ]
                                        },
                                        {
                                            condition: "AND",
                                            filters: [
                                                {
                                                    fieldPathId: "values.title",
                                                    negate: false,
                                                    path: "values.title",
                                                    compareValue: "some level #3.1 value",
                                                    transformValue: expect.any(Function),
                                                    plugin: expect.any(Object),
                                                    field: expect.any(Object)
                                                }
                                            ],
                                            expressions: [
                                                {
                                                    condition: "OR",
                                                    filters: [],
                                                    expressions: [
                                                        {
                                                            condition: "AND",
                                                            expressions: [],
                                                            filters: [
                                                                {
                                                                    fieldPathId: "values.price",
                                                                    negate: false,
                                                                    path: "values.price",
                                                                    compareValue: 110,
                                                                    transformValue:
                                                                        expect.any(Function),
                                                                    plugin: expect.any(Object),
                                                                    field: expect.any(Object)
                                                                },
                                                                {
                                                                    fieldPathId: "values.price",
                                                                    negate: false,
                                                                    path: "values.price",
                                                                    compareValue: 490,
                                                                    transformValue:
                                                                        expect.any(Function),
                                                                    plugin: expect.any(Object),
                                                                    field: expect.any(Object)
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            condition: "AND",
                                                            expressions: [],
                                                            filters: [
                                                                {
                                                                    fieldPathId: "values.title",
                                                                    negate: false,
                                                                    path: "values.title",
                                                                    compareValue:
                                                                        "some level #4 value",
                                                                    transformValue:
                                                                        expect.any(Function),
                                                                    plugin: expect.any(Object),
                                                                    field: expect.any(Object)
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    condition: "AND",
                                    filters: [],
                                    expressions: [
                                        {
                                            condition: "AND",
                                            expressions: [],
                                            filters: [
                                                {
                                                    fieldPathId: "values.price",
                                                    negate: false,
                                                    path: "values.price",
                                                    compareValue: 100,
                                                    transformValue: expect.any(Function),
                                                    plugin: expect.any(Object),
                                                    field: expect.any(Object)
                                                },
                                                {
                                                    fieldPathId: "values.price",
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
                                            filters: [
                                                {
                                                    fieldPathId: "values.isMarried",
                                                    negate: false,
                                                    path: "values.isMarried",
                                                    compareValue: true,
                                                    transformValue: expect.any(Function),
                                                    plugin: expect.any(Object),
                                                    field: expect.any(Object)
                                                }
                                            ],
                                            expressions: [
                                                {
                                                    condition: "OR",
                                                    filters: [],
                                                    expressions: [
                                                        {
                                                            condition: "AND",
                                                            expressions: [],
                                                            filters: [
                                                                {
                                                                    fieldPathId: "values.price",
                                                                    negate: false,
                                                                    path: "values.price",
                                                                    compareValue: 120,
                                                                    transformValue:
                                                                        expect.any(Function),
                                                                    plugin: expect.any(Object),
                                                                    field: expect.any(Object)
                                                                },
                                                                {
                                                                    fieldPathId: "values.price",
                                                                    negate: false,
                                                                    path: "values.price",
                                                                    compareValue: 480,
                                                                    transformValue:
                                                                        expect.any(Function),
                                                                    plugin: expect.any(Object),
                                                                    field: expect.any(Object)
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            condition: "AND",
                                                            expressions: [],
                                                            filters: [
                                                                {
                                                                    fieldPathId: "values.title",
                                                                    negate: false,
                                                                    path: "values.title",
                                                                    compareValue:
                                                                        "some level #4 value",
                                                                    transformValue:
                                                                        expect.any(Function),
                                                                    plugin: expect.any(Object),
                                                                    field: expect.any(Object)
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    condition: "OR",
                    filters: [],
                    expressions: [
                        {
                            condition: "AND",
                            expressions: [],
                            filters: [
                                {
                                    fieldPathId: "values.price",
                                    negate: false,
                                    path: "values.price",
                                    compareValue: 777,
                                    transformValue: expect.any(Function),
                                    plugin: expect.any(Object),
                                    field: expect.any(Object)
                                }
                            ]
                        },
                        {
                            condition: "AND",
                            expressions: [],
                            filters: [
                                {
                                    fieldPathId: "values.isMarried",
                                    negate: false,
                                    path: "values.isMarried",
                                    compareValue: false,
                                    transformValue: expect.any(Function),
                                    plugin: expect.any(Object),
                                    field: expect.any(Object)
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        expect(rootAndOrResult).toEqual(rootAndOrExpected);
    });

    /**
     * Expression test for "should filter out all products with conditional filters - server proof - or"
     * packages/api-headless-cms/__tests__/filtering/product.conditional.test.ts
     */
    it("test for product conditional test", async () => {
        const result = createExpressions({
            plugins,
            fields,
            where: {
                OR: [
                    {
                        values: {
                            price_between: [200, 300]
                        },
                        OR: [
                            {
                                values: {
                                    title: "black"
                                }
                            },
                            {
                                OR: [
                                    {
                                        values: {
                                            title_contains: "version"
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        OR: [
                            {
                                values: {
                                    availableOn_gte: "2024-02-01",
                                    availableOn_lte: "2024-02-02"
                                }
                            }
                        ]
                    }
                ]
            }
        });

        const expected: Expression = {
            condition: "OR",
            filters: [],
            expressions: [
                {
                    condition: "AND",
                    filters: [
                        {
                            fieldPathId: "values.price",
                            negate: false,
                            path: "values.price",
                            compareValue: [200, 300],
                            transformValue: expect.any(Function),
                            plugin: expect.any(Object),
                            field: expect.any(Object)
                        }
                    ],
                    expressions: [
                        {
                            condition: "OR",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.title",
                                            negate: false,
                                            path: "values.title",
                                            compareValue: "black",
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        }
                                    ]
                                },
                                {
                                    condition: "AND",
                                    filters: [],
                                    expressions: [
                                        {
                                            condition: "OR",
                                            filters: [],
                                            expressions: [
                                                {
                                                    condition: "AND",
                                                    expressions: [],
                                                    filters: [
                                                        {
                                                            fieldPathId: "values.title",
                                                            negate: false,
                                                            path: "values.title",
                                                            compareValue: "version",
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
                            ]
                        }
                    ]
                },
                {
                    condition: "AND",
                    filters: [],
                    expressions: [
                        {
                            condition: "OR",
                            filters: [],
                            expressions: [
                                {
                                    condition: "AND",
                                    expressions: [],
                                    filters: [
                                        {
                                            fieldPathId: "values.availableOn",
                                            negate: false,
                                            path: "values.availableOn",
                                            compareValue: "2024-02-01",
                                            transformValue: expect.any(Function),
                                            plugin: expect.any(Object),
                                            field: expect.any(Object)
                                        },
                                        {
                                            fieldPathId: "values.availableOn",
                                            negate: false,
                                            path: "values.availableOn",
                                            compareValue: "2024-02-02",
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
            ]
        };

        expect(result).toEqual(expected);
    });
});
