import { beforeEach, describe, expect, it } from "vitest";
import { useProductManageHandler } from "~tests/testHelpers/useProductManageHandler";
import type { Product, ProductCategory, ProductCategoryRef } from "~tests/types";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { createCategoryFactory } from "~tests/filtering/product/category";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

interface ICreateProductParams {
    category: ProductCategoryRef;
}

const createProduct = (params: ICreateProductParams): Product => {
    const { category } = params;
    return {
        title: "Test product",
        price: 1234567890,
        availableOn: "2020-01-01",
        color: "black",
        inStock: true,
        itemsInStock: 202,
        image: "test-product.png",
        availableSizes: ["s", "m", "l"],
        category,
        richText: [
            {
                type: "div",
                children: [
                    {
                        type: "h1",
                        content: "Title of the test product"
                    },
                    {
                        type: "div",
                        children: [
                            {
                                type: "p",
                                content: "The value of deeply nested paragraph."
                            }
                        ]
                    }
                ]
            },
            {
                type: "p",
                content: "The value of the root level paragraph."
            }
        ],
        variant: {
            name: "variant #1",
            category,
            price: 101,
            images: ["test-product.png"],
            options: [
                {
                    name: "subvariant #1",
                    category,
                    categories: [category],
                    price: 1234567890,
                    image: "test-product.png",
                    longText: ["Long text in the subvariant #1"]
                }
            ]
        }
    };
};

describe("storage transform for complex entries", () => {
    const managerOptions = {
        path: "manage"
    };
    const productManager = useProductManageHandler(managerOptions);

    const categoryManager = useCategoryManageHandler(managerOptions);

    const createCategory = createCategoryFactory(categoryManager);

    let categoryRecord: ProductCategory;

    beforeEach(async () => {
        await setupGroupAndModels({
            manager: categoryManager,
            models: ["category", "product"]
        });
        categoryRecord = await createCategory();
    });

    it("should properly transform product to and from storage", async () => {
        const category = {
            id: categoryRecord.id,
            modelId: "category"
        };

        const categoryAsRef = () => {
            return {
                ...category,
                entryId: categoryRecord.entryId
            };
        };

        const product = createProduct({
            category
        });

        const [createResult] = await productManager.createProduct({
            data: {
                values: product
            }
        });

        expect(createResult).toEqual({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.any(String),
                        modifiedOn: null,
                        savedOn: expect.any(String),
                        firstPublishedOn: null,
                        lastPublishedOn: null,
                        createdBy: expect.any(Object),
                        values: {
                            ...product,
                            category: categoryAsRef(),
                            variant: {
                                ...product.variant,
                                category: categoryAsRef(),
                                options: (product.variant?.options || []).map(options => {
                                    return {
                                        ...options,
                                        category: categoryAsRef(),
                                        categories: options.categories.map(() => {
                                            return categoryAsRef();
                                        })
                                    };
                                })
                            }
                        },
                        meta: expect.any(Object)
                    },
                    error: null
                }
            }
        });
    });
});
