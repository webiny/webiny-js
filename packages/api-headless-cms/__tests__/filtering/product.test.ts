import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { createInitFactory } from "./product/init";
import { createEntriesFactory } from "./product/entries";
import { createCategoryFactory } from "./product/category";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { Product, ProductCategory } from "../types";

describe("complex filtering", () => {
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

    const findProduct = (name: string): Product => {
        const product = products.find(p => p.title.toLowerCase() === name.toLowerCase());
        if (!product) {
            throw new Error(`There is no product "${name}".`);
        }
        return product;
    };

    beforeEach(async () => {
        await init();
        category = await createCategory();
        products = await createEntries(category);
    });

    it("should filter a single product with a nested filter - server", async () => {
        /**
         * Query which must find the product - AND.
         */
        // const [andResponse] = await listProducts({
        //     where: {
        //         title_contains: "ser",
        //         AND: [
        //             {
        //                 title_contains: "ser"
        //             },
        //             {
        //                 price_between: [35000, 100000],
        //                 AND: [
        //                     {
        //                         color: "red"
        //                     },
        //                     {
        //                         AND: [
        //                             {
        //                                 inStock: false
        //                             }
        //                         ]
        //                     }
        //                 ]
        //             },
        //             {
        //                 availableOn_gte: "2021-01-01"
        //             }
        //         ]
        //     }
        // });
        //
        // expect(andResponse).toEqual({
        //     data: {
        //         listProducts: {
        //             data: [findProduct("server")],
        //             meta: {
        //                 hasMoreItems: false,
        //                 totalCount: 1,
        //                 cursor: null
        //             },
        //             error: null
        //         }
        //     }
        // });
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
                                availableOn_gte: "2021-01-01",
                                availableOn_lte: "2021-01-02"
                            }
                        ]
                    }
                ]
            }
        });
        expect(orResponse).toEqual({
            data: {
                listProducts: {
                    data: [findProduct("server")],
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
});
