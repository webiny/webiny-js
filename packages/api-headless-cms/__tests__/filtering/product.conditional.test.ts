import { beforeEach, describe, expect, it } from "vitest";
import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { createEntriesFactory } from "./product/entries";
import { createCategoryFactory } from "./product/category";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { Product } from "../types";
import { createGetProduct } from "./product/getProductFactory";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";
import type { ICategoryResponseValues } from "~tests/testHelpers/category/manage/types.js";

describe("complex product conditional filtering", () => {
    const options = {
        path: "manage"
    };

    const categoryManager = useCategoryManageHandler(options);
    const manager = useProductManageHandler(options);

    const { listProducts } = manager;

    const createCategory = createCategoryFactory(categoryManager);
    const createEntries = createEntriesFactory(manager);

    let category: IManageQueryBaseResponse<ICategoryResponseValues>;
    let products: IManageQueryBaseResponse<Product>[];
    let getProduct: ReturnType<typeof createGetProduct>;

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["product", "category"]
        });
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
                values: {
                    title_contains: "ser"
                },
                AND: [
                    {
                        values: {
                            title_contains: "ser"
                        }
                    },
                    {
                        values: {
                            price_between: [35000, 100000]
                        },
                        AND: [
                            {
                                values: {
                                    color: "red"
                                }
                            },
                            {
                                AND: [
                                    {
                                        values: {
                                            inStock: false
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        values: {
                            availableOn_gte: "2021-01-01"
                        }
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
                        values: {
                            price_between: [35000, 100000]
                        },
                        OR: [
                            {
                                values: {
                                    color: "red"
                                }
                            },
                            {
                                OR: [
                                    {
                                        values: {
                                            title_contains: "ver"
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        AND: [
                            {
                                values: {
                                    availableOn_gte: "2021-02-01",
                                    availableOn_lte: "2021-02-02"
                                }
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
                values: {
                    title_contains: "ser"
                },
                AND: [
                    {
                        values: {
                            title_contains: "ser"
                        }
                    },
                    {
                        values: {
                            price_between: [100, 200]
                        },
                        AND: [
                            {
                                values: {
                                    color: "red"
                                }
                            },
                            {
                                AND: [
                                    {
                                        values: {
                                            inStock: false
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        values: {
                            availableOn_gte: "2021-01-01"
                        }
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
                values: {
                    title_contains: "ser"
                },
                AND: [
                    {
                        values: {
                            title_contains: "ser"
                        }
                    },
                    {
                        values: {
                            price_between: [35000, 100000]
                        },
                        AND: [
                            {
                                values: {
                                    color: "red"
                                }
                            },
                            {
                                AND: [
                                    {
                                        values: {
                                            inStock: false
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        values: {
                            availableOn_gte: "2024-01-01"
                        }
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
                values: {
                    title_contains: "ser"
                },
                AND: [
                    {
                        values: {
                            title_contains: "ser"
                        }
                    },
                    {
                        values: {
                            price_between: [35000, 100000]
                        },
                        AND: [
                            {
                                values: {
                                    color: "red"
                                }
                            },
                            {
                                AND: [
                                    {
                                        values: {
                                            inStock: true
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        values: {
                            availableOn_gte: "2021-01-01"
                        }
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
                        values: {
                            price_between: [200, 300]
                        },
                        OR: [
                            {
                                values: {
                                    color: "black"
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
                values: {
                    inStock_not: true
                },
                AND: [
                    {
                        values: {
                            color: "red"
                        }
                    },
                    {
                        values: {
                            price_between: [750, 37591]
                        },
                        AND: [
                            {
                                AND: [
                                    {
                                        values: {
                                            inStock: false
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        values: {
                            availableOn_gte: "2021-01-01"
                        }
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
                        values: {
                            price_between: [35000, 100000]
                        },
                        OR: [
                            {
                                values: {
                                    color: "red"
                                }
                            },
                            {
                                OR: [
                                    {
                                        values: {
                                            title_contains: "ver"
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        AND: [
                            {
                                values: {
                                    availableOn_gte: "2021-02-01",
                                    availableOn_lte: "2021-02-02"
                                }
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
                        values: {
                            price_between: [35000, 100000]
                        },
                        OR: [
                            {
                                values: {
                                    color: "red"
                                }
                            },
                            {
                                OR: [
                                    {
                                        values: {
                                            title_contains: "ver"
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        AND: [
                            {
                                values: {
                                    availableOn_gte: "2021-02-01",
                                    availableOn_lte: "2021-02-02"
                                }
                            }
                        ]
                    },
                    {
                        values: {
                            price_between: [880, 900]
                        }
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
