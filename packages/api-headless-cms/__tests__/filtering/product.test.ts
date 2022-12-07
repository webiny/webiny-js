import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { createInitFactory } from "./product/init";
import { createEntriesFactory } from "./product/entries";
import { createCategoryFactory } from "./product/category";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { Product, ProductCategory } from "../types";
import { getIt } from "./it";
import lodashCamelCase from "lodash/camelCase";

describe("complex product filtering", () => {
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

    const getProduct = (name: string): Product => {
        const product = products.find(p => lodashCamelCase(p.title) === lodashCamelCase(name));
        if (!product) {
            throw new Error(`There is no product "${name}".`);
        }
        return product;
    };

    const it = getIt(categoryManager.storageOperations.name);

    beforeEach(async () => {
        await init();
        category = await createCategory();
        products = await createEntries(category);
    });

    it("should filter a single product with a nested filter - server", async () => {
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

    it("should filter a single product with a nested filter - server and gaming console", async () => {
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
