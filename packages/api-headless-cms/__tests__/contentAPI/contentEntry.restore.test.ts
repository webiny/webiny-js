import { setupContentModelGroup, setupContentModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { useCategoryReadHandler } from "~tests/testHelpers/useCategoryReadHandler";
import { CmsEntry } from "~/types";
import { toSlug } from "~/utils/toSlug";

jest.setTimeout(100000);

interface CreateCategoryParams {
    title: string;
    slug: string;
}
type Categories = CmsEntry[];

describe("restore entries", () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });
    const reader = useCategoryReadHandler({
        path: "read/en-US"
    });

    const createCategory = async (data: CreateCategoryParams) => {
        const [response] = await manager.createCategory({
            data
        });

        console.log("response", JSON.stringify(response));

        const createdCategory = response.data.createCategory.data;

        if (response.data.createCategory.error) {
            throw new Error(response.data.createCategory.error.message);
        }

        const [publish] = await manager.publishCategory({
            revision: createdCategory.id
        });
        if (publish.data.publishCategory.error) {
            throw new Error(publish.data.publishCategory.error.message);
        }

        return publish.data.publishCategory.data;
    };

    const titles = [
        "Space Exploration",
        "Food Production",
        "Tech Industry",
        "Mental Health",
        "Maritime Industry",
        "Space Industry",
        "Bug Reporting",
        "Car Reviews",
        "Mobile Phone Reviews",
        "Movie Reviews",
        "Book Reviews",
        "Music Reviews",
        "Game Reviews",
        "TV Show Reviews"
    ];

    const createCategories = async () => {
        const results: Categories = [];
        for (const title of titles) {
            const result = await createCategory({
                title,
                slug: toSlug(title)
            });
            results.push(result);
        }

        return results;
    };

    const setupCategories = async () => {
        const group = await setupContentModelGroup(manager);
        await setupContentModels(manager, group, ["category"]);
        return createCategories();
    };

    it("should move an entry to trash bin and then restore it", async () => {
        const categories = await setupCategories();

        const [listManageResponse] = await manager.listCategories();
        expect(listManageResponse.data.listCategories.data).toHaveLength(titles.length);
        const [listReadResponse] = await reader.listCategories();
        expect(listReadResponse.data.listCategories.data).toHaveLength(titles.length);

        const categoryToDelete = categories[0];

        /**
         * Let's now delete one entry, marking it as deleted.
         */
        const [deleteResponse] = await manager.deleteCategory({
            revision: categoryToDelete.entryId,
            options: {
                permanently: false
            }
        });
        expect(deleteResponse).toMatchObject({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });

        /**
         * Let's check that has been removed from the list.
         */
        const [listAfterDeleteManageResponse] = await manager.listCategories();
        expect(listAfterDeleteManageResponse.data.listCategories.meta.totalCount).toBe(
            titles.length - 1
        );
        const [listAfterDeleteReadResponse] = await reader.listCategories();
        expect(listAfterDeleteReadResponse.data.listCategories.data).toHaveLength(
            titles.length - 1
        );

        /**
         * ...and we should not be able to get the entry anymore.
         */
        const [getAfterDeleteManageResponse] = await manager.getCategory({
            revision: categoryToDelete.id
        });
        const [getAfterDeleteReadResponse] = await manager.getCategory({
            revision: categoryToDelete.id
        });
        expect(getAfterDeleteManageResponse).toMatchObject({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "NOT_FOUND",
                        message: expect.any(String)
                    }
                }
            }
        });
        expect(getAfterDeleteReadResponse).toMatchObject({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "NOT_FOUND",
                        message: expect.any(String)
                    }
                }
            }
        });

        /**
         * Let's list the deleted items found in the bin, via manage endpoint...
         */
        const [listDeletedManageResponse] = await manager.listDeletedCategories();
        expect(listDeletedManageResponse).toEqual({
            data: {
                listDeletedCategories: {
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            entryId: categoryToDelete.entryId,
                            deletedBy: expect.any(Object),
                            deletedOn: expect.any(String)
                        })
                    ]),
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });

        /**
         * Let's try to restore an entry from the bin, we should get the success response...
         */
        const [restoreBinItemResponse] = await manager.restoreCategory({
            revision: categoryToDelete.entryId
        });
        expect(restoreBinItemResponse).toMatchObject({
            data: {
                restoreCategory: {
                    data: true,
                    error: null
                }
            }
        });

        /**
         * ...but, if we try to repeat the operation, it should fail.
         */
        const [restoreAgainBinItemResponse] = await manager.restoreCategory({
            revision: categoryToDelete.entryId
        });
        expect(restoreAgainBinItemResponse).toMatchObject({
            data: {
                restoreCategory: {
                    data: null,
                    error: {
                        code: "NOT_FOUND",
                        data: null,
                        message: `Entry "${categoryToDelete.entryId}" was not found!`
                    }
                }
            }
        });

        /**
         * Let's check that has been restored from the trash bin.
         */
        const [listAfterRestoreManageResponse] = await manager.listCategories();
        expect(listAfterRestoreManageResponse.data.listCategories.meta.totalCount).toBe(
            titles.length
        );
        const [listAfterRestoreReadResponse] = await reader.listCategories();
        expect(listAfterRestoreReadResponse.data.listCategories.data).toHaveLength(titles.length);

        /**
         * ...and we should be able to get the entry.
         */
        const [getAfterRestoreManageResponse] = await manager.getCategory({
            revision: categoryToDelete.id
        });
        const [getAfterRestoreReadResponse] = await manager.getCategory({
            revision: categoryToDelete.id
        });
        expect(getAfterRestoreManageResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...categoryToDelete,
                        deletedOn: expect.any(String),
                        deletedBy: {
                            id: "id-12345678",
                            displayName: "John Doe",
                            type: "admin"
                        }
                    },
                    error: null
                }
            }
        });
        expect(getAfterRestoreReadResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...categoryToDelete,
                        deletedOn: expect.any(String),
                        deletedBy: {
                            id: "id-12345678",
                            displayName: "John Doe",
                            type: "admin"
                        }
                    },
                    error: null
                }
            }
        });
    });
});
