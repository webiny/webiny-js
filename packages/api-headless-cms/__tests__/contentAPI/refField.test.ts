import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsContentEntryType, CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import models from "./mocks/contentModels";
import { useReviewManageHandler } from "../utils/useReviewManageHandler";
import { useProductManageHandler } from "../utils/useProductManageHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useReviewReadHandler } from "../utils/useReviewReadHandler";
import { useAuthorManageHandler } from "../utils/useAuthorManageHandler";

describe("refField", () => {
    const esCmsIndex = "root-headless-cms";

    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        elasticSearch,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsContentModelGroupType> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        return createCMG.data.createContentModelGroup.data;
    };

    const setupContentModel = async (contentModelGroup: CmsContentModelGroupType, name: string) => {
        const model = models.find(m => m.modelId === name);
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        } else if (create.data.createContentModel.data.error) {
            console.error(`[beforeEach] ${create.data.createContentModel.data.error.message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return update.data.updateContentModel.data;
    };
    const setupContentModels = async (contentModelGroup: CmsContentModelGroupType) => {
        const models = {
            category: null,
            product: null,
            review: null,
            author: null
        };
        for (const name in models) {
            models[name] = await setupContentModel(contentModelGroup, name);
        }
        return models;
    };

    const createCategory = async () => {
        const { createCategory } = useCategoryManageHandler({
            ...manageOpts
        });
        const [createCategoryResponse] = await createCategory({
            data: {
                title: "Vegetables",
                slug: "vegetables"
            }
        });
        return createCategoryResponse.data.createCategory.data as CmsContentEntryType;
    };

    const createProduct = async (category: CmsContentEntryType) => {
        const { createProduct, publishProduct } = useProductManageHandler({
            ...manageOpts
        });

        const [createProductResponse] = await createProduct({
            data: {
                title: "Potato",
                price: 100,
                availableOn: "2020-12-25T16:37:00Z.000",
                color: "white",
                availableSizes: ["s", "m"],
                image: "file.jpg",
                category: {
                    modelId: "category",
                    entryId: category.id
                }
            }
        });

        const product = createProductResponse.data.createProduct.data as CmsContentEntryType;

        await publishProduct({
            revision: product.id
        });

        return product;
    };

    const createAuthor = async () => {
        const { createAuthor, publishAuthor } = useAuthorManageHandler({
            ...manageOpts
        });
        const [createResponse] = await createAuthor({
            data: {
                fullName: "John Doe"
            }
        });

        const author = createResponse.data.createAuthor.data;

        await publishAuthor({
            revision: author.id
        });

        return author;
    };

    beforeEach(async () => {
        try {
            await elasticSearch.indices.create({ index: esCmsIndex });
        } catch {}
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({ index: esCmsIndex });
        } catch {}
    });

    test("should create review connected to a product", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupContentModels(contentModelGroup);

        const category = await createCategory();
        const product = await createProduct(category);
        const author = await createAuthor();

        const {
            until,
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
                    entryId: product.id
                },
                author: {
                    modelId: "author",
                    entryId: author.id
                },
                text: `review text`,
                rating: 5
            }
        });

        const review = createResponse.data.createReview.data;

        const [publishResponse] = await publishReview({
            revision: review.id
        });

        const { publishedOn } = publishResponse.data.publishReview.data.meta;

        const [manageGetResponse] = await manageGetReview({
            revision: review.id
        });

        expect(manageGetResponse).toEqual({
            data: {
                getReview: {
                    data: {
                        id: review.id,
                        createdOn: review.createdOn,
                        savedOn: review.savedOn,
                        text: "review text",
                        rating: 5,
                        meta: {
                            locked: true,
                            modelId: "review",
                            publishedOn: publishedOn,
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
                            entryId: product.id,
                            modelId: "product"
                        },
                        author: {
                            modelId: "author",
                            entryId: author.id
                        }
                    },
                    error: null
                }
            }
        });

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => manageListReviews().then(([data]) => data),
            ({ data }) => data.listReviews.data.length > 0,
            { name: "manage list reviews" }
        );

        const [manageListResponse] = await manageListReviews();

        expect(manageListResponse).toEqual({
            data: {
                listReviews: {
                    data: [
                        {
                            author: {
                                entryId: author.id,
                                modelId: "author"
                            },
                            createdOn: review.createdOn,
                            id: review.id,
                            meta: {
                                locked: true,
                                modelId: "review",
                                publishedOn: publishedOn,
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
                                entryId: product.id,
                                modelId: "product"
                            },
                            rating: 5,
                            savedOn: review.savedOn,
                            text: review.text
                        }
                    ],
                    error: null,
                    meta: {
                        cursor: expect.any(String),
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });

        const { getReview: readGetReview } = useReviewReadHandler({
            ...readOpts
        });

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () =>
                readGetReview({
                    where: {
                        id: review.id
                    }
                }).then(([data]) => data),
            ({ data }) => data.getReview.data.id === review.id,
            { name: "get created review" }
        );

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
                        savedOn: review.savedOn,
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
});
