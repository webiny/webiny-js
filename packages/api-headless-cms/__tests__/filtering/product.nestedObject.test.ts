import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { createInitFactory } from "./product/init";
import { createEntriesFactory } from "./product/entries";
import { createCategoryFactory } from "./product/category";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { Product, ProductCategory } from "../types";
import { createGetProduct } from "./product/getProductFactory";

describe("complex product nestedObject filtering", () => {
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

    it("should filter a single product with nested object filter", async () => {
        /**
         * Filtering by variant name contains v1
         */
        const [responseVariantNameV1] = await listProducts({
            where: {
                variant: {
                    name_contains: "v1"
                }
            }
        });

        expect(responseVariantNameV1).toEqual({
            data: {
                listProducts: {
                    data: [getProduct("tv"), getProduct("server")],
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
         * Filtering by variant price between
         */
        const [responseVariantPriceBetween] = await listProducts({
            where: {
                variant: {
                    price_between: [675, 685]
                }
            }
        });
        expect(responseVariantPriceBetween).toEqual({
            data: {
                listProducts: {
                    data: [getProduct("tv")],
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
         * Filtering by variant category and price range
         */
        const [responseVariantCategoryPriceBetween] = await listProducts({
            where: {
                price_between: [675, 785],
                category: {
                    id: category.id
                },
                variant: {
                    category: {
                        id: category.id
                    },
                    price_between: [675, 681]
                }
            }
        });
        expect(responseVariantCategoryPriceBetween).toEqual({
            data: {
                listProducts: {
                    data: [getProduct("tv")],
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
