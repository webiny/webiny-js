import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsEntry } from "~/types";
import { useReviewManageHandler } from "../testHelpers/useReviewManageHandler";
import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useReviewReadHandler } from "../testHelpers/useReviewReadHandler";
import { useAuthorManageHandler } from "../testHelpers/useAuthorManageHandler";
import { useWrapManageHandler } from "~tests/testHelpers/useWrapManageHandler";
import {
    setupContentModelGroup,
    setupContentModels as setupContentModelsBase
} from "~tests/testHelpers/setup";
import { useWrapReadHandler } from "~tests/testHelpers/useWrapReadHandler";

interface CreateCategoryParams {
    title?: string;
    slug?: string;
}

interface CreateProductParams {
    title?: string;
    price?: number;
    availableOn?: string;
    color?: string;
    availableSizes?: string[];
    image?: string;
}

interface CreateAuthorParams {
    fullName?: string;
}

describe("refField", () => {
    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const mainHandler = useGraphQLHandler(manageOpts);

    const setupContentModels = async (
        handler: ReturnType<typeof useGraphQLHandler>,
        models?: string[]
    ) => {
        const group = await setupContentModelGroup(handler);
        return await setupContentModelsBase(
            handler,
            group,
            models || ["category", "product", "review", "author"]
        );
    };

    const createCategory = async (params?: CreateCategoryParams) => {
        const { createCategory, publishCategory } = useCategoryManageHandler({
            ...manageOpts
        });
        const [createCategoryResponse] = await createCategory({
            data: {
                title: "Vegetables",
                slug: "vegetables",
                ...params
            }
        });
        const [publishCategoryResponse] = await publishCategory({
            revision: createCategoryResponse.data.createCategory.data.id
        });

        return publishCategoryResponse.data.publishCategory.data as CmsEntry;
    };

    const createProduct = async (category: CmsEntry, params?: CreateProductParams) => {
        const { createProduct, publishProduct } = useProductManageHandler({
            ...manageOpts
        });

        const [createProductResponse] = await createProduct({
            data: {
                title: "Potato",
                price: 100,
                availableOn: "2020-12-25",
                color: "white",
                availableSizes: ["s", "m"],
                image: "file.jpg",
                ...params,
                category: {
                    modelId: "category",
                    id: category.id
                }
            }
        });

        expect(createProductResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });

        const [publishProductResponse] = await publishProduct({
            revision: createProductResponse.data.createProduct.data.id
        });

        return publishProductResponse.data.publishProduct.data;
    };

    const createAuthor = async (params?: CreateAuthorParams) => {
        const { createAuthor, publishAuthor } = useAuthorManageHandler({
            ...manageOpts
        });
        const [createResponse] = await createAuthor({
            data: {
                fullName: "John Doe",
                ...params
            }
        });

        const [publishAuthorResponse] = await publishAuthor({
            revision: createResponse.data.createAuthor.data.id
        });

        return publishAuthorResponse.data.publishAuthor.data;
    };

    it("should create review connected to a product", async () => {
        await setupContentModels(mainHandler);

        const category = await createCategory();
        const product = await createProduct(category);
        const author = await createAuthor();

        const {
            createReview,
            getReview: manageGetReview,
            listReviews: manageListReviews,
            publishReview
        } = useReviewManageHandler({
            ...manageOpts
        });

        const [createResponse] = await createReview({
            data: {
                product: {
                    modelId: "product",
                    id: product.id
                },
                author: {
                    modelId: "author",
                    id: author.id
                },
                text: `review text`,
                rating: 5
            }
        });

        const review = createResponse.data.createReview.data;

        const [publishResponse] = await publishReview({
            revision: review.id
        });

        const publishedReview = publishResponse.data.publishReview.data;
        const { firstPublishedOn, modifiedOn, lastPublishedOn } = publishedReview;

        const [manageGetResponse] = await manageGetReview({
            revision: review.id
        });

        expect(manageGetResponse).toEqual({
            data: {
                getReview: {
                    data: {
                        id: review.id,
                        entryId: review.entryId,
                        createdOn: review.createdOn,
                        createdBy: {
                            id: "id-12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        savedOn: publishedReview.savedOn,
                        text: "review text",
                        rating: 5,
                        lastPublishedOn,
                        firstPublishedOn,
                        modifiedOn,
                        meta: {
                            locked: true,
                            modelId: "review",
                            revisions: [
                                {
                                    id: review.id,
                                    text: review.text
                                }
                            ],
                            status: "published",
                            title: review.text,
                            version: 1
                        },
                        product: {
                            id: product.id,
                            entryId: product.entryId,
                            modelId: "product"
                        },
                        author: {
                            modelId: "author",
                            entryId: author.entryId,
                            id: author.id
                        }
                    },
                    error: null
                }
            }
        });

        const [manageListResponse] = await manageListReviews();

        expect(manageListResponse).toEqual({
            data: {
                listReviews: {
                    data: [
                        {
                            id: review.id,
                            entryId: review.entryId,
                            author: {
                                id: author.id,
                                entryId: author.entryId,
                                modelId: "author"
                            },
                            createdOn: review.createdOn,
                            createdBy: {
                                id: "id-12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            lastPublishedOn,
                            firstPublishedOn,
                            modifiedOn,
                            meta: {
                                locked: true,
                                modelId: "review",
                                revisions: [
                                    {
                                        id: review.id,
                                        text: review.text
                                    }
                                ],
                                status: "published",
                                title: review.text,
                                version: 1
                            },
                            product: {
                                id: product.id,
                                entryId: product.entryId,
                                modelId: "product"
                            },
                            rating: 5,
                            savedOn: publishedReview.savedOn,
                            text: review.text
                        }
                    ],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });

        const { getReview: readGetReview } = useReviewReadHandler({
            ...readOpts
        });

        const [response] = await readGetReview({
            where: {
                id: review.id
            }
        });

        expect(response).toEqual({
            data: {
                getReview: {
                    data: {
                        id: review.id,
                        createdOn: review.createdOn,
                        savedOn: publishedReview.savedOn,
                        text: "review text",
                        rating: 5,
                        product: {
                            id: product.id,
                            title: "Potato"
                        },
                        author: {
                            id: author.id,
                            fullName: author.fullName
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should properly order related items from multiple models", async () => {
        const manageHandler = useWrapManageHandler(manageOpts);
        const readHandler = useWrapReadHandler({
            ...readOpts
        });
        await setupContentModels(manageHandler, [
            "wrap",
            "category",
            "author",
            "product",
            "fruit",
            "bug"
        ]);

        const categoryOne = await createCategory({
            title: "Category One",
            slug: "category-one"
        });
        const categoryTwo = await createCategory({
            title: "Category Two",
            slug: "category-two"
        });

        const productOne = await createProduct(categoryOne, {
            title: "Product One",
            price: 100,
            availableOn: "2020-12-25",
            color: "white",
            availableSizes: ["s", "m"],
            image: "file.jpg"
        });
        const productTwo = await createProduct(categoryTwo, {
            title: "Product Two",
            price: 100,
            availableOn: "2020-12-25",
            color: "white",
            availableSizes: ["s", "m"],
            image: "file.jpg"
        });

        const authorOne = await createAuthor({
            fullName: "Author One"
        });
        const authorTwo = await createAuthor({
            fullName: "Author Two"
        });

        const references = [
            {
                id: productTwo.id,
                modelId: "product"
            },
            {
                id: categoryTwo.id,
                modelId: "category"
            },
            {
                id: authorTwo.id,
                modelId: "author"
            },
            {
                id: categoryOne.id,
                modelId: "category"
            },
            {
                id: productOne.id,
                modelId: "product"
            },

            {
                id: authorOne.id,
                modelId: "author"
            }
        ];
        const [createResponse] = await manageHandler.createWrap({
            data: {
                title: "Wrap One",
                references
            }
        });
        expect(createResponse).toMatchObject({
            data: {
                createWrap: {
                    data: {
                        title: "Wrap One",
                        references
                    },
                    error: null
                }
            }
        });

        for (const index in references) {
            const responseReference = createResponse.data.createWrap.data.references[index];
            expect(responseReference).toMatchObject(references[index]);
        }

        const [publishResponse] = await manageHandler.publishWrap({
            revision: createResponse.data.createWrap.data.id
        });
        expect(publishResponse).toMatchObject({
            data: {
                publishWrap: {
                    data: {
                        title: "Wrap One",
                        references,
                        meta: {
                            status: "published"
                        }
                    },
                    error: null
                }
            }
        });

        const [listResponse] = await readHandler.listWraps();

        expect(listResponse.errors).toBeUndefined();

        expect(listResponse).toMatchObject({
            data: {
                listWraps: {
                    data: [
                        {
                            references
                        }
                    ],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });
    });

    it("should create a product which is not connected to category and list and filter by the category value", async () => {
        await setupContentModels(mainHandler);
        const { createProduct, listProducts } = useProductManageHandler({
            ...manageOpts
        });

        const [listEmptyResult] = await listProducts({
            where: {
                category: null
            }
        });
        expect(listEmptyResult).toMatchObject({
            data: {
                listProducts: {
                    data: [],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 0
                    }
                }
            }
        });

        const data = {
            title: "Potato",
            price: 100,
            availableOn: "2020-12-25",
            color: "white",
            availableSizes: ["s", "m"],
            image: "file.jpg",
            category: null
        };
        const [createResponse] = await createProduct({
            data
        });

        expect(createResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String),
                        ...data,
                        category: null
                    },
                    error: null
                }
            }
        });

        const [listResult] = await listProducts();

        expect(listResult).toMatchObject({
            data: {
                listProducts: {
                    data: [
                        {
                            id: expect.any(String),
                            entryId: expect.any(String),
                            ...data,
                            category: null
                        }
                    ],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });

        const [whereNullResult] = await listProducts({
            where: {
                category: null
            }
        });
        expect(whereNullResult).toMatchObject({
            data: {
                listProducts: {
                    data: [
                        {
                            id: expect.any(String),
                            entryId: expect.any(String),
                            ...data,
                            category: null
                        }
                    ],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });

        const [whereUndefinedResult] = await listProducts({
            where: {
                category: undefined
            }
        });
        expect(whereUndefinedResult).toMatchObject({
            data: {
                listProducts: {
                    data: [
                        {
                            id: expect.any(String),
                            entryId: expect.any(String),
                            ...data,
                            category: null
                        }
                    ],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });
    });
});
