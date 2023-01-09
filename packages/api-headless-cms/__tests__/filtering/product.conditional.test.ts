import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { createInitFactory } from "./product/init";
import { createEntriesFactory } from "./product/entries";
import { createCategoryFactory } from "./product/category";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { Product, ProductCategory } from "../types";
import { createGetProduct } from "./product/getProductFactory";

describe("complex product conditional filtering", () => {
    const options = {
        path: "manage/en-US"
    };

    const categoryManager = useCategoryManageHandler(options);
    const manager = useProductManageHandler(options);

    const { listProducts } = manager;

    const init = createInitFactory(manager);
    const createEntries = createEntriesFactory(manager);
    const createCategory = createCategoryFactory(categoryManager);

    let category: ProductCategory;
    let products: Product[];
    let getProduct: ReturnType<typeof createGetProduct>;

    beforeEach(async () => {
        await init();
        category = await createCategory();
        products = await createEntries(category);
        getProduct = createGetProduct(products);
    });
    /**
     * This tests proves that nested filtering results in a single required record.
     */
    it("should filter a single product with a nested conditional filter - server", async () => {
        /**
         * Query which must find the product - AND.
         */
        const [andResponse] = await listProducts({
            where: {
                title_contains: "ser",
                AND: [
                    {
                        title_contains: "ser"
                    },
                    {
                        price_between: [35000, 100000],
                        AND: [
                            {
                                color: "red"
                            },
                            {
                                AND: [
                                    {
                                        inStock: false
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        availableOn_gte: "2021-01-01"
                    }
                ]
            }
        });

        expect(andResponse).toEqual({
            data: {
                listProducts: {
                    data: [getProduct("server")],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Query which must find the product - OR.
         */
        const [orResponse] = await listProducts({
            where: {
                OR: [
                    {
                        price_between: [35000, 100000],
                        OR: [
                            {
                                color: "red"
                            },
                            {
                                OR: [
                                    {
                                        title_contains: "ver"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        AND: [
                            {
                                availableOn_gte: "2021-02-01",
                                availableOn_lte: "2021-02-02"
                            }
                        ]
                    }
                ]
            }
        });
        expect(orResponse).toEqual({
            data: {
                listProducts: {
                    data: [getProduct("server")],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });
    /**
     * Nested AND queries.
     *
     * This test proves that nested filtering, with a single wrong parameter, will not produce a record.
     */
    it("should filter out all products with conditional filters - server proof - and", async () => {
        /**
         * Expectation is the same for all responses in this test.
         */
        const expected = {
            data: {
                listProducts: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        };
        /**
         * where.and[1].price_between
         */
        const [response1] = await listProducts({
            where: {
                title_contains: "ser",
                AND: [
                    {
                        title_contains: "ser"
                    },
                    {
                        price_between: [100, 200],
                        AND: [
                            {
                                color: "red"
                            },
                            {
                                AND: [
                                    {
                                        inStock: false
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        availableOn_gte: "2021-01-01"
                    }
                ]
            }
        });

        expect(response1).toEqual(expected);
        /**
         * where.and[2].availableOn_gte
         */
        const [response2] = await listProducts({
            where: {
                title_contains: "ser",
                AND: [
                    {
                        title_contains: "ser"
                    },
                    {
                        price_between: [35000, 100000],
                        AND: [
                            {
                                color: "red"
                            },
                            {
                                AND: [
                                    {
                                        inStock: false
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        availableOn_gte: "2024-01-01"
                    }
                ]
            }
        });

        expect(response2).toEqual(expected);

        /**
         * where.and[1].and[1].and[0].inStock
         */
        const [response3] = await listProducts({
            where: {
                title_contains: "ser",
                AND: [
                    {
                        title_contains: "ser"
                    },
                    {
                        price_between: [35000, 100000],
                        AND: [
                            {
                                color: "red"
                            },
                            {
                                AND: [
                                    {
                                        inStock: true
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        availableOn_gte: "2021-01-01"
                    }
                ]
            }
        });

        expect(response3).toEqual(expected);
    });

    /**
     * Nested OR queries.
     *
     * This test proves that nested filtering, with all wrong parameters, will not produce a record.
     */
    it("should filter out all products with conditional filters - server proof - or", async () => {
        /**
         * Expectation is the same for all responses in this test.
         */
        const expected = {
            data: {
                listProducts: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        };
        /**
         *
         */
        const [orResponse] = await listProducts({
            where: {
                OR: [
                    {
                        price_between: [200, 300],
                        OR: [
                            {
                                color: "black"
                            },
                            {
                                OR: [
                                    {
                                        title_contains: "version"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        OR: [
                            {
                                availableOn_gte: "2024-02-01",
                                availableOn_lte: "2024-02-02"
                            }
                        ]
                    }
                ]
            }
        });
        expect(orResponse).toEqual(expected);
    });
    /**
     *
     */
    it("should filter a single product with a nested conditional filter - server and gaming console", async () => {
        /**
         * Query which must find the products - AND.
         */
        const [andResponse] = await listProducts({
            where: {
                inStock_not: true,
                AND: [
                    {
                        color: "red"
                    },
                    {
                        price_between: [750, 37591],
                        AND: [
                            {
                                AND: [
                                    {
                                        inStock: false
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        availableOn_gte: "2021-01-01"
                    }
                ]
            }
        });

        expect(andResponse).toEqual({
            data: {
                listProducts: {
                    data: [getProduct("gaming console"), getProduct("server")],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 2,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Query must find a single product. This is actually a check for the next query being ran.
         * In next query we will add OR price_between to find the gaming console product.
         */
        const [orSingleResponse] = await listProducts({
            where: {
                OR: [
                    {
                        price_between: [35000, 100000],
                        OR: [
                            {
                                color: "red"
                            },
                            {
                                OR: [
                                    {
                                        title_contains: "ver"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        AND: [
                            {
                                availableOn_gte: "2021-02-01",
                                availableOn_lte: "2021-02-02"
                            }
                        ]
                    }
                ]
            }
        });
        expect(orSingleResponse).toEqual({
            data: {
                listProducts: {
                    data: [getProduct("server")],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Query which must find both products - OR.
         */
        const [orBothResponse] = await listProducts({
            where: {
                OR: [
                    {
                        price_between: [35000, 100000],
                        OR: [
                            {
                                color: "red"
                            },
                            {
                                OR: [
                                    {
                                        title_contains: "ver"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        AND: [
                            {
                                availableOn_gte: "2021-02-01",
                                availableOn_lte: "2021-02-02"
                            }
                        ]
                    },
                    {
                        price_between: [880, 900]
                    }
                ]
            }
        });
        expect(orBothResponse).toEqual({
            data: {
                listProducts: {
                    data: [getProduct("gaming console"), getProduct("server")],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 2,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });
});
