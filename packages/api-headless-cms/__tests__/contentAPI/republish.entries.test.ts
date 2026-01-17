import { beforeEach, describe, expect, it } from "vitest";
import { mdbid } from "@webiny/utils";
import type { CmsEntry, CmsModel } from "~/types";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useCategoryReadHandler } from "../testHelpers/useCategoryReadHandler";
import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { createStorageOperationsContext } from "~tests/storageOperations/context";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

interface CreateEntryResult {
    entry: CmsEntry;
    input: Record<string, any>;
}

describe("Republish entries", () => {
    const readOpts = { path: "read" };
    const manageOpts = { path: "manage" };

    const categoryManager = useCategoryManageHandler(manageOpts);
    const { createCategory, publishCategory, republishCategory } = categoryManager;
    
    let categoryModel: CmsModel;
    let productModel: CmsModel;

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager: categoryManager,
            models: ["category", "product"]
        });
        productModel = result.getModel("product");
        categoryModel = result.getModel("category");
    });

    const createPublishedCategories = async () => {
        /**
         * Create test categories.
         */
        const [appleResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Apple",
                        slug: "apple"
                    }
                }
            }
        });
        const appleOriginal = appleResponse.data.createCategory.data!;
        const [bananaResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Banana",
                        slug: "banana"
                    }
                }
            }
        });
        const bananaOriginal = bananaResponse.data.createCategory.data!;
        const [orangeResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Orange",
                        slug: "orange"
                    }
                }
            }
        });
        const orangeOriginal = orangeResponse.data.createCategory.data!;

        /**
         * Publish all the categories.
         */
        const [applePublishResponse] = await publishCategory({
            variables: {
                revision: appleOriginal.id
            }
        });
        const apple = applePublishResponse.data.publishCategory.data!;

        const [bananaPublishResponse] = await publishCategory({
            variables: {
                revision: bananaOriginal.id
            }
        });
        const banana = bananaPublishResponse.data.publishCategory.data!;
        const [orangePublishResponse] = await publishCategory({
            variables: {
                revision: orangeOriginal.id
            }
        });
        const orange = orangePublishResponse.data.publishCategory.data!;

        return {
            appleOriginal: appleOriginal,
            applePublished: apple,
            bananaOriginal: bananaOriginal,
            bananaPublished: banana,
            orangeOriginal: orangeOriginal,
            orangePublished: orange
        };
    };

    const createEntry = (
        model: CmsModel,
        input: Record<string, any>,
        add = 0
    ): CreateEntryResult => {
        const id = mdbid();
        const date = new Date();
        date.setTime(date.getTime() + add);
        return {
            entry: {
                id: `${id}#0001`,
                entryId: id,
                tenant: model.tenant,
                locked: false,
                values: input,
                createdOn: date.toISOString(),
                savedOn: date.toISOString(),
                modelId: model.modelId,
                status: "draft",
                version: 1,
                createdBy: {
                    id: "admin",
                    type: "admin",
                    displayName: "Admin"
                }
            } as unknown as CmsEntry,
            input
        };
    };

    it("should republish entries without changing them", async () => {

        const { listCategories } = useCategoryReadHandler(readOpts);

        const {
            appleOriginal,
            applePublished,
            orangeOriginal,
            orangePublished,
            bananaPublished,
            bananaOriginal
        } = await createPublishedCategories();
        

        /**
         * Now we republish all categories and expect they did not change.
         */
        const [appleRepublishResponse] = await republishCategory({
            variables: {
                revision: appleOriginal.id
            }
        });
        expect(appleRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: {
                        ...applePublished,
                        modifiedOn: expect.toBeDateString(),
                        lastPublishedOn: expect.toBeDateString(),
                        savedOn: expect.toBeDateString()
                    },
                    error: null
                }
            }
        });
        applePublished.savedOn = appleRepublishResponse.data.republishCategory.data!.savedOn;

        const [bananaRepublishResponse] = await republishCategory({
            variables: {
                revision: bananaOriginal.id
            }
        });
        expect(bananaRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: {
                        ...bananaPublished,
                        modifiedOn: expect.toBeDateString(),
                        lastPublishedOn: expect.toBeDateString(),
                        savedOn: expect.toBeDateString()
                    },
                    error: null
                }
            }
        });
        bananaPublished.savedOn = bananaRepublishResponse.data.republishCategory.data!.savedOn;

        const [orangeRepublishResponse] = await republishCategory({
            variables: {
                revision: orangeOriginal.id
            }
        });
        expect(orangeRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: {
                        ...orangePublished,
                        modifiedOn: expect.toBeDateString(),
                        lastPublishedOn: expect.toBeDateString(),
                        savedOn: expect.toBeDateString()
                    },
                    error: null
                }
            }
        });
        orangePublished.savedOn = orangeRepublishResponse.data.republishCategory.data!.savedOn;

        const [response] = await listCategories({
            sort: ["createdOn_ASC"]
        });

        expect(response).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: applePublished.id,
                            values: {
                                title: applePublished.values.title
                            },
                            savedOn: applePublished.savedOn
                        },
                        {
                            id: bananaPublished.id,
                            values: {
                                title: bananaPublished.values.title
                            },
                            savedOn: bananaPublished.savedOn
                        },
                        {
                            id: orangePublished.id,
                            values: {
                                title: orangePublished.values.title
                            },
                            savedOn: orangePublished.savedOn
                        }
                    ],
                    meta: {
                        totalCount: 3,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    /**
     * This test checks values directly in the storage operations, so we make sure there are required values in ref objects.
     * We check in both latest and published records because in different storages that can be two different records.
     */
    it("storage operations - should republish entries without changing them", async () => {
        const { applePublished, bananaPublished } = await createPublishedCategories();
        const { publishProduct, republishProduct } = useProductManageHandler(manageOpts);
        const { storageOperations, plugins } = categoryManager;

        await storageOperations.beforeInit(
            await createStorageOperationsContext({
                plugins
            })
        );

        const { entry: galaEntry } = createEntry(productModel, {
            title: "Gala",
            category: {
                entryId: applePublished.id,
                modelId: categoryModel.modelId
            },
            price: 1,
            color: "red",
            image: "https://webiny.com/gala.png"
        });
        const { entry: goldenEntry } = createEntry(
            productModel,
            {
                title: "Golden",
                category: {
                    entryId: bananaPublished.id,
                    modelId: categoryModel.modelId
                },
                price: 1,
                color: "white",
                image: "https://webiny.com/golden.png"
            },
            5
        );

        const galaRecord = await storageOperations.entries.create(productModel, {
            entry: galaEntry,
            storageEntry: galaEntry
        });

        const goldenRecord = await storageOperations.entries.create(productModel, {
            entry: goldenEntry,
            storageEntry: goldenEntry
        });

        expect(galaRecord).toEqual({
            ...galaEntry
        });

        const [publishGalaResponse] = await publishProduct({
            revision: galaRecord.id
        });

        expect(publishGalaResponse).toMatchObject({
            data: {
                publishProduct: {
                    data: {
                        id: galaRecord.id
                    },
                    error: null
                }
            }
        });

        const [publishGoldenResponse] = await publishProduct({
            revision: goldenRecord.id
        });

        expect(publishGoldenResponse).toMatchObject({
            data: {
                publishProduct: {
                    data: {
                        id: goldenRecord.id
                    },
                    error: null
                }
            }
        });

        const [republishGalaResponse] = await republishProduct({
            revision: galaRecord.id
        });
        expect(republishGalaResponse).toMatchObject({
            data: {
                republishProduct: {
                    data: {
                        id: galaRecord.id
                    },
                    error: null
                }
            }
        });
        const [republishGoldenResponse] = await republishProduct({
            revision: goldenRecord.id
        });
        expect(republishGoldenResponse).toMatchObject({
            data: {
                republishProduct: {
                    data: {
                        id: goldenRecord.id
                    },
                    error: null
                }
            }
        });

        /**
         * And now we need to go directly into storage and check that values on the product records are ok.
         * We must call both latest and published.
         */
        const latestProducts = await storageOperations.entries.list(productModel, {
            where: {
                latest: true
            },
            limit: 10000,
            sort: ["createdOn_ASC"]
        });

        expect(latestProducts).toMatchObject({
            items: [
                {
                    entryId: galaRecord.entryId,
                    createdOn: galaRecord.createdOn,
                    values: {
                        category: {
                            id: applePublished.id,
                            entryId: applePublished.entryId,
                            modelId: categoryModel.modelId
                        }
                    }
                },
                {
                    entryId: goldenRecord.entryId,
                    createdOn: goldenRecord.createdOn,
                    values: {
                        category: {
                            id: bananaPublished.id,
                            entryId: bananaPublished.entryId,
                            modelId: categoryModel.modelId
                        }
                    }
                }
            ],
            hasMoreItems: false,
            totalCount: 2
        });

        const latestGalaRecord = await storageOperations.entries.get(productModel, {
            where: {
                id: galaRecord.id,
                latest: true
            }
        });

        expect(latestGalaRecord).toMatchObject({
            id: galaRecord.id,
            values: {
                category: {
                    id: applePublished.id,
                    entryId: applePublished.entryId,
                    modelId: categoryModel.modelId
                }
            }
        });

        const latestGoldenRecord = await storageOperations.entries.get(productModel, {
            where: {
                id: goldenRecord.id,
                latest: true
            }
        });

        expect(latestGoldenRecord).toMatchObject({
            id: goldenRecord.id,
            values: {
                category: {
                    id: bananaPublished.id,
                    entryId: bananaPublished.entryId,
                    modelId: categoryModel.modelId
                }
            }
        });

        const publishedProducts = await storageOperations.entries.list(productModel, {
            where: {
                published: true
            },
            limit: 10000,
            sort: ["createdOn_ASC"]
        });

        expect(publishedProducts).toMatchObject({
            items: [
                {
                    entryId: galaRecord.entryId,
                    createdOn: galaRecord.createdOn,
                    values: {
                        category: {
                            id: applePublished.id,
                            entryId: applePublished.entryId,
                            modelId: categoryModel.modelId
                        }
                    }
                },
                {
                    entryId: goldenRecord.entryId,
                    createdOn: goldenRecord.createdOn,
                    values: {
                        category: {
                            id: bananaPublished.id,
                            entryId: bananaPublished.entryId,
                            modelId: categoryModel.modelId
                        }
                    }
                }
            ],
            hasMoreItems: false,
            totalCount: 2
        });

        const publishedGalaRecord = await storageOperations.entries.get(productModel, {
            where: {
                id: galaRecord.id,
                published: true
            }
        });

        expect(publishedGalaRecord).toMatchObject({
            id: galaRecord.id,
            values: {
                category: {
                    id: applePublished.id,
                    entryId: applePublished.entryId,
                    modelId: categoryModel.modelId
                }
            }
        });

        const publishedGoldenRecord = await storageOperations.entries.get(productModel, {
            where: {
                id: goldenRecord.id,
                published: true
            }
        });

        expect(publishedGoldenRecord).toMatchObject({
            id: goldenRecord.id,
            values: {
                category: {
                    id: bananaPublished.id,
                    entryId: bananaPublished.entryId,
                    modelId: categoryModel.modelId
                }
            }
        });
    });
});
