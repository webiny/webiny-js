import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { CmsEntry, CmsGroup } from "~/types";
import models from "./mocks/contentModels";
import { useReviewManageHandler } from "../utils/useReviewManageHandler";
import { useProductManageHandler } from "../utils/useProductManageHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useReviewReadHandler } from "../utils/useReviewReadHandler";
import { useAuthorManageHandler } from "../utils/useAuthorManageHandler";

describe("refField", () => {
    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsGroup> => {
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

    const setupContentModel = async (contentModelGroup: CmsGroup, name: string) => {
        const model = models.find(m => m.modelId === name);
        if (!model) {
            throw new Error(`Could not find model "${name}".`);
        }
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
    const setupContentModels = async (contentModelGroup: CmsGroup) => {
        const models: Record<string, any> = {
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
        return createCategoryResponse.data.createCategory.data as CmsEntry;
    };

    const createProduct = async (category: CmsEntry) => {
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
                category: {
                    modelId: "category",
                    id: category.id
                }
            }
        });

        const [publishProductResponse] = await publishProduct({
            revision: createProductResponse.data.createProduct.data.id
        });

        return publishProductResponse.data.publishProduct.data;
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

        const [publishAuthorResponse] = await publishAuthor({
            revision: createResponse.data.createAuthor.data.id
        });

        return publishAuthorResponse.data.publishAuthor.data;
    };

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
        const { publishedOn } = publishedReview.meta;

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
                            id: "12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        savedOn: publishedReview.savedOn,
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

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => manageListReviews().then(([data]) => data),
            ({ data }: any) => data.listReviews.data[0].meta.publishedOn === publishedOn,
            { name: "manage list reviews" }
        );

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
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
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

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () =>
                readGetReview({
                    where: {
                        id: review.id
                    }
                }).then(([data]) => data),
            ({ data }: any) => data.getReview.data.id === review.id,
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
});
