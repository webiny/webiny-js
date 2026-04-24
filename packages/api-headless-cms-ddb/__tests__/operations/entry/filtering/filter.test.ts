import { beforeEach, describe, expect, it } from "vitest";
import { createEntries } from "./mocks/entry.model";
import { createExpressions, Expression } from "~/operations/entry/filtering/createExpressions";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { Field } from "~/operations/entry/filtering/types";
import { createPluginsContainer } from "../../helpers/pluginsContainer";
import { createModel } from "../../helpers/createModel";
import { createFields } from "~/operations/entry/filtering/createFields";
import { filter } from "~/operations/entry/filtering";
import { getSearchableFields } from "@webiny/api-headless-cms/crud/contentEntry/searchableFields";
import { Container } from "@webiny/di";
import { GraphQLFeature } from "@webiny/api-headless-cms/features/graphql/index.js";
import { createTestContainer } from "../../helpers/createTestContainer";

describe("filtering cms ddb", () => {
    let plugins: PluginsContainer;
    let model: CmsModel;
    let fields: Record<string, Field>;
    let container: Container;

    beforeEach(() => {
        plugins = createPluginsContainer();
        model = createModel();
        container = createTestContainer();
        GraphQLFeature.register(container);
        fields = createFields({
            plugins,
            fields: model.fields
        });
    });

    const filterByCreatedOn: [number, number][] = [
        [25, 75],
        [1, 99],
        [100, 0],
        [0, 100]
    ];

    it.each(filterByCreatedOn)(
        "should filter entries by createdOn - %s results",
        async (expectedResults, modifier) => {
            const records = createEntries(100).map(r => {
                // @ts-expect-error
                delete r.values;

                return r;
            });

            const createdOn = new Date();
            /**
             * We want to filter out all the records which are not created after current date + modifier.
             * We reduce 5000ms from the time because test can be slower so results will be inconsistent.
             *
             */
            createdOn.setTime(createdOn.getTime() + modifier * 1000 * 86400 - 5000);

            const createExpressionsParams = {
                plugins,
                container,
                where: {
                    createdOn_gte: createdOn.toISOString()
                },
                fields
            };

            /**
             * We want to make sure that filters are properly constructed
             */
            const expressions = createExpressions(createExpressionsParams);

            const expectedExpressions: Expression = {
                condition: "AND",
                expressions: [],
                filters: [
                    {
                        compareValue: createdOn.toISOString(),
                        field: expect.objectContaining({
                            fieldId: "createdOn"
                        }),
                        filter: expect.objectContaining({
                            operation: "gte"
                        }),
                        negate: false,
                        fieldPathId: "createdOn",
                        path: "createdOn",
                        transformValue: expect.any(Function)
                    }
                ]
            };
            expect(expressions).toEqual(expectedExpressions);

            const result = filter({
                items: records,
                where: createExpressionsParams.where,
                plugins,
                container,
                fields
            });

            expect(result).toHaveLength(expectedResults);

            expect(result).toEqual(records.slice(modifier));
        }
    );

    it("should filter by title", async () => {
        const records = createEntries(100);

        const result = filter({
            items: records,
            where: {
                values: {
                    title_contains: "tttt"
                }
            },
            plugins,
            container,
            fields
        });

        expect(result).toHaveLength(10);

        expect(result).toMatchObject(
            [...Array(10)].map((_, index) => {
                return {
                    values: {
                        title: `Title modeled entry ${String(index).padStart(5, "t")}`
                    }
                };
            })
        );
    });

    it("should filter by nested options keys", async () => {
        const records = createEntries(100);

        const resultBoth = filter({
            items: records,
            where: {
                values: {
                    options: {
                        keys_contains: "the modeled entry kkkk"
                    }
                }
            },
            plugins,
            container,
            fields
        });

        expect(resultBoth).toHaveLength(10);

        expect(resultBoth).toMatchObject(
            [...Array(10)].map((_, index) => {
                return {
                    values: {
                        options: [
                            {
                                keys: `keys of the modeled entry kkkk${index} - 1`
                            },
                            {
                                keys: `keys of the modeled entry kkkk${index} - 2`
                            }
                        ]
                    }
                };
            })
        );

        const resultNumber2 = filter({
            items: records,
            where: {
                values: {
                    options: {
                        keys_contains: " - 2"
                    }
                }
            },
            plugins,
            container,
            fields
        });

        expect(resultNumber2).toHaveLength(100);

        expect(resultNumber2).toMatchObject(
            [...Array(100)].map((_, index) => {
                return {
                    values: {
                        options: [
                            {
                                keys: `keys of the modeled entry ${String(index).padStart(
                                    5,
                                    "k"
                                )} - 1`
                            },
                            {
                                keys: `keys of the modeled entry ${String(index).padStart(
                                    5,
                                    "k"
                                )} - 2`
                            }
                        ]
                    }
                };
            })
        );

        const resultNumber3 = filter({
            items: records,
            where: {
                values: {
                    options: {
                        keys_contains: " - 3"
                    }
                }
            },
            plugins,
            container,
            fields
        });

        expect(resultNumber3).toHaveLength(19);
    });

    it("should filter by nested options variant colors", async () => {
        const records = createEntries(100);

        const resultRed = filter({
            items: records,
            where: {
                values: {
                    options: {
                        variant: {
                            colors: ["red"]
                        }
                    }
                }
            },
            plugins,
            container,
            fields
        });

        expect(resultRed).toHaveLength(50);

        expect(resultRed).toMatchObject(
            [...Array(50)].map(() => {
                return {
                    values: {
                        options: [
                            {
                                variant: {
                                    colors: ["red", "blue"]
                                }
                            },
                            {
                                variant: {
                                    colors: ["yellow", "green"]
                                }
                            }
                        ]
                    }
                };
            })
        );

        const resultTeal = filter({
            items: records,
            where: {
                values: {
                    options: {
                        variant: {
                            colors: ["teal"]
                        }
                    }
                }
            },
            plugins,
            container,
            fields
        });

        expect(resultTeal).toHaveLength(50);

        expect(resultTeal).toMatchObject(
            [...Array(50)].map(() => {
                return {
                    values: {
                        options: [
                            {
                                variant: {
                                    colors: ["black", "white"]
                                }
                            },
                            {
                                variant: {
                                    colors: ["teal", "grey"]
                                }
                            }
                        ]
                    }
                };
            })
        );

        const resultBoth = filter({
            items: records,
            where: {
                values: {
                    options: {
                        variant: {
                            colors_in: ["teal", "green"]
                        }
                    }
                }
            },
            plugins,
            container,
            fields
        });

        expect(resultBoth).toHaveLength(100);

        expect(resultBoth).toMatchObject(
            [...Array(100)].map((_, index) => {
                return {
                    values: {
                        options: [
                            {
                                variant: {
                                    colors: index % 2 === 0 ? ["red", "blue"] : ["black", "white"]
                                }
                            },
                            {
                                variant: {
                                    colors: index % 2 === 0 ? ["yellow", "green"] : ["teal", "grey"]
                                }
                            }
                        ]
                    }
                };
            })
        );

        const resultNoneOrange = filter({
            items: records,
            where: {
                values: {
                    options: {
                        variant: {
                            colors_in: ["orange"]
                        }
                    }
                }
            },
            plugins,
            container,
            fields
        });

        expect(resultNoneOrange).toHaveLength(0);

        const resultNoneEmpty = filter({
            items: records,
            where: {
                values: {
                    options: {
                        variant: {
                            colors_in: []
                        }
                    }
                }
            },
            plugins,
            container,
            fields
        });

        expect(resultNoneEmpty).toHaveLength(0);
    });

    it("should run a full text search", async () => {
        const records = createEntries(5);

        const searchableFields = getSearchableFields({
            fields: model.fields,
            input: [],
            context: { plugins, container }
        });
        /**
         * Find yellow color items.
         */
        const resultsYellow = filter({
            items: records,
            where: {},
            plugins,
            container,
            fields,
            fullTextSearch: {
                term: "yellow",
                fields: searchableFields
            }
        });
        expect(resultsYellow).toHaveLength(3);

        /**
         * Find yellow color items.
         */
        const resultsWhite = filter({
            items: records,
            where: {},
            plugins,
            container,
            fields,
            fullTextSearch: {
                term: "white",
                fields: searchableFields
            }
        });
        expect(resultsWhite).toHaveLength(2);

        /**
         * Find grey color items.
         */
        const resultsGrey = filter({
            items: records,
            where: {},
            plugins,
            container,
            fields,
            fullTextSearch: {
                term: "grey",
                fields: searchableFields
            }
        });
        expect(resultsGrey).toHaveLength(2);

        /**
         * Find red color items.
         */
        const resultsRed = filter({
            items: records,
            where: {},
            plugins,
            container,
            fields,
            fullTextSearch: {
                term: "red",
                fields: searchableFields
            }
        });
        expect(resultsRed).toHaveLength(3);
    });
});
