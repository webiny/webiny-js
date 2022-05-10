import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsEntry, CmsGroup, CmsModel } from "~/types";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useCategoryReadHandler } from "../utils/useCategoryReadHandler";
// @ts-ignore
import mdbid from "mdbid";
import { useProductReadHandler } from "../utils/useProductReadHandler";
import { useProductManageHandler } from "../utils/useProductManageHandler";
const cliPackageJson = require("@webiny/cli/package.json");
const webinyVersion = cliPackageJson.version;

interface CreateEntryResult {
    entry: CmsEntry;
    input: Record<string, any>;
}

describe("Republish entries", () => {
    const readOpts = { path: "read/en-US" };
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation,
        until
    } = useContentGqlHandler(manageOpts);

    const { createCategory, publishCategory, republishCategory } =
        useCategoryManageHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupGroup = async (): Promise<CmsGroup> => {
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

    const setupModel = async (contentModelGroup: CmsGroup, modelId: string): Promise<CmsModel> => {
        const model = models.find(m => m.modelId === modelId);
        if (!model) {
            throw new Error(`Could not find model "${modelId}".`);
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
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return {
            ...update.data.updateContentModel.data,
            tenant: "root",
            locale: "en-US"
        };
    };

    const createPublishedCategories = async () => {
        /**
         * Create test categories.
         */
        const [appleResponse] = await createCategory({
            data: {
                title: "Apple",
                slug: "apple"
            }
        });
        const appleOriginal = appleResponse.data.createCategory.data;
        const [bananaResponse] = await createCategory({
            data: {
                title: "Banana",
                slug: "banana"
            }
        });
        const bananaOriginal = bananaResponse.data.createCategory.data;
        const [orangeResponse] = await createCategory({
            data: {
                title: "Orange",
                slug: "orange"
            }
        });
        const orangeOriginal = orangeResponse.data.createCategory.data;

        /**
         * Publish all the categories.
         */
        const [applePublishResponse] = await publishCategory({
            revision: appleOriginal.id
        });
        const apple = applePublishResponse.data.publishCategory.data;

        const [bananaPublishResponse] = await publishCategory({
            revision: bananaOriginal.id
        });
        const banana = bananaPublishResponse.data.publishCategory.data;
        const [orangePublishResponse] = await publishCategory({
            revision: orangeOriginal.id
        });
        const orange = orangePublishResponse.data.publishCategory.data;

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
                locale: model.locale,
                tenant: model.tenant,
                webinyVersion,
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
                },
                ownedBy: {
                    id: "admin",
                    type: "admin",
                    displayName: "Admin"
                }
            },
            input
        };
    };

    test("should republish entries without changing them", async () => {
        const group = await setupGroup();
        await setupModel(group, "category");

        const { listCategories } = useCategoryReadHandler(readOpts);

        const categories = await createPublishedCategories();

        const {
            appleOriginal,
            applePublished,
            orangeOriginal,
            orangePublished,
            bananaPublished,
            bananaOriginal
        } = categories;

        /**
         * Wait for the categories to be published
         */
        await until(
            () => listCategories(),
            ([response]: any) => {
                return response.data.listCategories.data.length === 3;
                // if (!result) {
                //     console.log("after publishing categories not passing");
                //     console.log(JSON.stringify(response.data));
                // }
                // return result;
            },
            {
                name: "after publishing categories"
            }
        );
        /**
         * Now we republish all categories and expect they did not change.
         */
        const [appleRepublishResponse] = await republishCategory({
            revision: appleOriginal.id
        });
        expect(appleRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: {
                        ...applePublished,
                        savedOn: expect.stringMatching(/^20/)
                    },
                    error: null
                }
            }
        });
        applePublished.savedOn = appleRepublishResponse.data.republishCategory.data.savedOn;

        const [bananaRepublishResponse] = await republishCategory({
            revision: bananaOriginal.id
        });
        expect(bananaRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: {
                        ...bananaPublished,
                        savedOn: expect.stringMatching(/^20/)
                    },
                    error: null
                }
            }
        });
        bananaPublished.savedOn = bananaRepublishResponse.data.republishCategory.data.savedOn;

        const [orangeRepublishResponse] = await republishCategory({
            revision: orangeOriginal.id
        });
        expect(orangeRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: {
                        ...orangePublished,
                        savedOn: expect.stringMatching(/^20/)
                    },
                    error: null
                }
            }
        });
        orangePublished.savedOn = orangeRepublishResponse.data.republishCategory.data.savedOn;

        const times = [applePublished.savedOn, bananaPublished.savedOn, orangePublished.savedOn];
        /**
         * Wait for the categories to be published
         */
        await until(
            () =>
                listCategories({
                    sort: ["createdOn_ASC"]
                }),
            ([response]: any) => {
                const items = response.data.listCategories.data;
                if (items.length !== 3) {
                    return false;
                }
                for (const key in times) {
                    if (items[key].savedOn !== times[key]) {
                        return false;
                    }
                }
                return true;
            },
            {
                name: "after republishing categories"
            }
        );
        const [response] = await listCategories({
            sort: ["createdOn_ASC"]
        });

        expect(response).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: applePublished.id,
                            title: applePublished.title,
                            savedOn: applePublished.savedOn
                        },
                        {
                            id: bananaPublished.id,
                            title: bananaPublished.title,
                            savedOn: bananaPublished.savedOn
                        },
                        {
                            id: orangePublished.id,
                            title: orangePublished.title,
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

    test("should not allow republishing of unpublished entries", async () => {
        const group = await setupGroup();
        await setupModel(group, "category");

        const { createCategory, republishCategory } = useCategoryManageHandler(manageOpts);

        /**
         * Create test categories.
         */
        const [appleResponse] = await createCategory({
            data: {
                title: "Apple",
                slug: "apple"
            }
        });
        const apple = appleResponse.data.createCategory.data;

        const [appleRepublishResponse] = await republishCategory({
            revision: apple.id
        });
        expect(appleRepublishResponse).toEqual({
            data: {
                republishCategory: {
                    data: null,
                    error: {
                        message: "Entry with given ID is not published!",
                        code: "NOT_PUBLISHED_ERROR",
                        data: expect.any(Object)
                    }
                }
            }
        });
    });

    /**
     * This test checks values directly in the storage operations so we make sure there are required values in ref objects.
     * We check in both latest and published records because in different storages that can be two different records.
     */
    test("storage operations - should republish entries without changing them", async () => {
        const group = await setupGroup();
        const categoryModel = await setupModel(group, "category");
        const productModel = await setupModel(group, "product");

        const { applePublished, bananaPublished } = await createPublishedCategories();

        const { listProducts: listReadProducts } = useProductReadHandler(readOpts);
        const { publishProduct, republishProduct } = useProductManageHandler(manageOpts);

        const { storageOperations } = useCategoryManageHandler(manageOpts);

        const { entry: galaEntry } = createEntry(productModel, {
            title: "Gala",
            category: {
                entryId: applePublished.id,
                modelId: categoryModel.modelId
            }
        });
        const { entry: goldenEntry } = createEntry(
            productModel,
            {
                title: "Golden",
                category: {
                    entryId: bananaPublished.id,
                    modelId: categoryModel.modelId
                }
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

        /**
         * Wait for the products to be published
         */
        await until(
            () =>
                listReadProducts({
                    sort: ["createdOn_ASC"]
                }),
            ([response]: any) => {
                const items = response.data.listProducts.data as any[];
                if (items.length !== 2) {
                    return false;
                }

                const targets: string[] = [galaRecord.id, goldenRecord.id];

                return items.every(item => {
                    return targets.includes(item.id);
                });
            },
            {
                name: "after publishing product"
            }
        );

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
        const galaSavedOn = republishGalaResponse.data.republishProduct.data.savedOn;
        const goldenSavedOn = republishGoldenResponse.data.republishProduct.data.savedOn;
        /**
         * Wait for the products to be published
         */
        await until(
            () =>
                listReadProducts({
                    sort: ["createdOn_ASC"]
                }),
            ([response]: any) => {
                const items: any[] = response.data.listProducts.data;
                if (items.length !== 2) {
                    return false;
                }
                const requiredIdList: string[] = [galaRecord.id, goldenRecord.id];
                const requiredTimes: string[] = [galaSavedOn, goldenSavedOn];
                return items.every(item => {
                    return requiredIdList.includes(item.id) && requiredTimes.includes(item.savedOn);
                });
            },
            {
                name: "after re-publishing product"
            }
        );
        /**
         * And now we need to go directly into storage and check that values on the product records are ok.
         * We must call both latest and published.
         */
        const latestProducts = await storageOperations.entries.list(productModel, {
            where: {
                latest: true
            },
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
