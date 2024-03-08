import { setupContentModelGroup, setupContentModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { CmsEntry } from "~/types";
import { toSlug } from "~/utils/toSlug";
import { useCategoryReadHandler } from "~tests/testHelpers/useCategoryReadHandler";

jest.setTimeout(100000);

interface CreateCategoryParams {
    title: string;
    slug: string;
}
type Categories = CmsEntry[];

describe("delete entries", () => {
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

    it("should delete an entry, destroying it", async () => {
        const categories = await setupCategories();

        const [listManageResponse] = await manager.listCategories();
        expect(listManageResponse.data.listCategories.data).toHaveLength(titles.length);
        const [listReadResponse] = await reader.listCategories();
        expect(listReadResponse.data.listCategories.data).toHaveLength(titles.length);

        const categoryToDelete = categories[0];

        /**
         * Let's now delete one entry.
         */
        const [deleteResponse] = await manager.deleteCategory({
            revision: categoryToDelete.entryId
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
         * Let's try to delete it again, it should not work...
         */
        const [deleteAgainResponse] = await manager.deleteCategory({
            revision: categoryToDelete.entryId
        });
        expect(deleteAgainResponse).toMatchObject({
            data: {
                deleteCategory: {
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
         * ...but I should not receive an error in case I "force" delete it.
         */
        const [deleteForceResponse] = await manager.deleteCategory({
            revision: categoryToDelete.entryId,
            options: {
                force: true
            }
        });
        expect(deleteForceResponse).toMatchObject({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });
    });

    it("should delete an entry, marking it as `deleted` a.k.a  moving it to the bin", async () => {
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
         * If we repeat the operation, trying to mark it as deleted again, we should get the non existing entry error.
         */
        const [secondDeleteResponse] = await manager.deleteCategory({
            revision: categoryToDelete.entryId,
            options: {
                permanently: false
            }
        });
        expect(secondDeleteResponse).toMatchObject({
            data: {
                deleteCategory: {
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
         * Let's try repeat the operation, trying to mark it as deleted again.
         */
        const [deleteAgainResponse] = await manager.deleteCategory({
            revision: categoryToDelete.entryId,
            options: {
                permanently: false
            }
        });
        expect(deleteAgainResponse).toMatchObject({
            data: {
                deleteCategory: {
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
         * Let's list the deleted items found in the bin, via manage endpoint...
         */
        const [listDeletedManageResponse] = await manager.listCategories({ deleted: true });
        expect(listDeletedManageResponse).toEqual({
            data: {
                listCategories: {
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
         * ...but I should not be able to list deleted items via read endpoint.
         */
        const [listDeletedReadResponse] = await reader.listCategories({ deleted: true });
        expect(listDeletedReadResponse.data.listCategories.data).toHaveLength(titles.length - 1);

        /**
         * ...and we should not be able to get the entry anymore.
         */
        const [getAfterBinManageResponse] = await manager.getCategory({
            revision: categoryToDelete.id
        });
        const [getAfterBinReadResponse] = await manager.getCategory({
            revision: categoryToDelete.id
        });
        expect(getAfterBinManageResponse).toMatchObject({
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
        expect(getAfterBinReadResponse).toMatchObject({
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
         * Let's try to destroy an item in the bin, we should get the success response...
         */
        const [destroyBinItemResponse] = await manager.deleteCategory({
            revision: categoryToDelete.entryId
        });
        expect(destroyBinItemResponse).toMatchObject({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });

        /**
         * ...but, if we try to repeat the operation, it should fail.
         */
        const [destroyAgainBinItemResponse] = await manager.deleteCategory({
            revision: categoryToDelete.entryId
        });
        expect(destroyAgainBinItemResponse).toMatchObject({
            data: {
                deleteCategory: {
                    data: null,
                    error: {
                        code: "NOT_FOUND",
                        data: null,
                        message: `Entry "${categoryToDelete.entryId}" was not found!`
                    }
                }
            }
        });
    });
});
