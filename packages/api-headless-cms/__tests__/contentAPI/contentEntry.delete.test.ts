import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { toSlug } from "~/utils/toSlug";
import { useCategoryReadHandler } from "~tests/testHelpers/useCategoryReadHandler";
import { ROOT_FOLDER } from "~/constants";
import type {
    ICategoryInputValues,
    ICategoryResponseValues
} from "~tests/testHelpers/category/manage/types.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

vi.setConfig({
    testTimeout: 100_000
});

type ICategory = IManageQueryBaseResponse<ICategoryResponseValues>;

describe("delete entries", () => {
    const manager = useCategoryManageHandler({
        path: "manage"
    });
    const reader = useCategoryReadHandler({
        path: "read"
    });

    const createCategory = async (values: ICategoryInputValues) => {
        const [response] = await manager.createCategory({
            variables: {
                data: {
                    values
                }
            }
        });

        const createdCategory = response.data.createCategory.data!;

        if (response.data.createCategory.error) {
            throw new Error(response.data.createCategory.error.message);
        }

        const [publish] = await manager.publishCategory({
            variables: {
                revision: createdCategory.id
            }
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
        const results: ICategory[] = [];
        for (const title of titles) {
            const result = await createCategory({
                title,
                slug: toSlug(title)
            });
            if (!result) {
                continue;
            }
            results.push(result);
        }

        return results;
    };
    let categories: ICategory[] = [];

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
        categories = await createCategories();
    });

    it("should delete an entry, destroying it", async () => {
        const [listManageResponse] = await manager.listCategories();
        expect(listManageResponse.data.listCategories.data).toHaveLength(titles.length);
        const [listReadResponse] = await reader.listCategories();
        expect(listReadResponse.data.listCategories.data).toHaveLength(titles.length);

        const categoryToDelete = categories[0];

        /**
         * Let's now delete one entry.
         */
        const [deleteResponse] = await manager.deleteCategory({
            variables: {
                revision: categoryToDelete.entryId
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
        expect(listAfterDeleteManageResponse.data.listCategories.meta!.totalCount).toBe(
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
            variables: {
                revision: categoryToDelete.id
            }
        });
        const [getAfterDeleteReadResponse] = await manager.getCategory({
            variables: {
                revision: categoryToDelete.id
            }
        });
        expect(getAfterDeleteManageResponse).toMatchObject({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
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
                        code: "Cms/Entry/NotFound",
                        message: expect.any(String)
                    }
                }
            }
        });

        /**
         * Let's try to delete it again, it should not work...
         */
        const [deleteAgainResponse] = await manager.deleteCategory({
            variables: {
                revision: categoryToDelete.entryId
            }
        });
        expect(deleteAgainResponse).toMatchObject({
            data: {
                deleteCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
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
            variables: {
                revision: categoryToDelete.entryId,
                options: {
                    force: true
                }
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
        const [listManageResponse] = await manager.listCategories();
        expect(listManageResponse.data.listCategories.data).toHaveLength(titles.length);
        const [listReadResponse] = await reader.listCategories();
        expect(listReadResponse.data.listCategories.data).toHaveLength(titles.length);

        const categoryToDelete = categories[0];

        /**
         * Let's now delete one entry, marking it as deleted.
         */
        const [deleteResponse] = await manager.deleteCategory({
            variables: {
                revision: categoryToDelete.entryId,
                options: {
                    permanently: false
                }
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
            variables: {
                revision: categoryToDelete.entryId,
                options: {
                    permanently: false
                }
            }
        });
        expect(secondDeleteResponse).toMatchObject({
            data: {
                deleteCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
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
        expect(listAfterDeleteManageResponse.data.listCategories.meta!.totalCount).toBe(
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
            variables: {
                revision: categoryToDelete.id
            }
        });
        const [getAfterDeleteReadResponse] = await reader.getCategory({
            where: { id: categoryToDelete.id }
        });
        expect(getAfterDeleteManageResponse).toMatchObject({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
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
                        code: "Cms/Entry/NotFound",
                        message: expect.any(String)
                    }
                }
            }
        });

        /**
         * Let's try to create from, update, publish, unpublish and move the entry.
         */
        const [createFromResponse] = await manager.createCategoryFrom({
            variables: {
                revision: categoryToDelete.entryId,
                data: {
                    values: {
                        title: "Create from title"
                    }
                }
            }
        });
        expect(createFromResponse).toMatchObject({
            data: {
                createCategoryFrom: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
                        data: null,
                        message: expect.any(String)
                    }
                }
            }
        });

        const [updateResponse] = await manager.updateCategory({
            variables: {
                revision: categoryToDelete.entryId,
                data: {
                    values: {
                        title: "Updated title"
                    }
                }
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
                        data: null,
                        message: expect.any(String)
                    }
                }
            }
        });

        const [publishResponse] = await manager.publishCategory({
            variables: {
                revision: categoryToDelete.id
            }
        });
        expect(publishResponse).toMatchObject({
            data: {
                publishCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
                        data: null,
                        message: expect.any(String)
                    }
                }
            }
        });

        const [unpublishResponse] = await manager.unpublishCategory({
            variables: {
                revision: categoryToDelete.id
            }
        });
        expect(unpublishResponse).toMatchObject({
            data: {
                unpublishCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
                        data: null,
                        message: expect.any(String)
                    }
                }
            }
        });

        const [moveResponse] = await manager.moveCategory({
            variables: {
                revision: categoryToDelete.id,
                folderId: "any-id"
            }
        });
        expect(moveResponse).toMatchObject({
            data: {
                moveCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
                        data: null,
                        message: expect.any(String)
                    }
                }
            }
        });

        /**
         * Let's try repeat the operation, trying to mark it as deleted again.
         */
        const [deleteAgainResponse] = await manager.deleteCategory({
            variables: {
                revision: categoryToDelete.entryId,
                options: {
                    permanently: false
                }
            }
        });
        expect(deleteAgainResponse).toMatchObject({
            data: {
                deleteCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
                        data: null,
                        message: `Entry "${categoryToDelete.entryId}" was not found!`
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
                            deletedOn: expect.any(String),
                            wbyAco_location: {
                                folderId: ROOT_FOLDER
                            }
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
         * ...and we should not be able to get the entry anymore.
         */
        const [getAfterBinManageResponse] = await manager.getCategory({
            variables: {
                revision: categoryToDelete.id
            }
        });
        const [getAfterBinReadResponse] = await manager.getCategory({
            variables: {
                revision: categoryToDelete.id
            }
        });
        expect(getAfterBinManageResponse).toMatchObject({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
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
                        code: "Cms/Entry/NotFound",
                        message: expect.any(String)
                    }
                }
            }
        });

        /**
         * Let's try to destroy an item in the bin, we should get the success response...
         */
        const [destroyBinItemResponse] = await manager.deleteCategory({
            variables: {
                revision: categoryToDelete.entryId
            }
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
            variables: {
                revision: categoryToDelete.entryId
            }
        });
        expect(destroyAgainBinItemResponse).toMatchObject({
            data: {
                deleteCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotFound",
                        data: null,
                        message: `Entry "${categoryToDelete.entryId}" was not found!`
                    }
                }
            }
        });
    });

    it("should delete an entry, moving it to the ROOT_FOLDER placed inside the bin", async () => {
        const [listManageResponse] = await manager.listCategories();
        expect(listManageResponse.data.listCategories.data).toHaveLength(titles.length);

        const categoryToDelete = categories[0];
        const newFolderId = "anotherFolder";

        /**
         * Let's now move the entry into a different folder
         */
        const [moveResponse] = await manager.moveCategory({
            variables: {
                revision: categoryToDelete.id,
                folderId: newFolderId
            }
        });

        expect(moveResponse).toMatchObject({
            data: {
                moveCategory: {
                    data: true,
                    error: null
                }
            }
        });

        /**
         * ...let's check the new location.
         */
        const [getAfterMoveManageResponse] = await manager.getCategory({
            variables: {
                revision: categoryToDelete.id
            }
        });

        expect(getAfterMoveManageResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...categoryToDelete,
                        wbyAco_location: {
                            folderId: newFolderId
                        }
                    },
                    error: null
                }
            }
        });

        /**
         * Let's now delete one entry, marking it as deleted.
         */
        const [deleteResponse] = await manager.deleteCategory({
            variables: {
                revision: categoryToDelete.entryId,
                options: {
                    permanently: false
                }
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
         * Let's list the deleted items found in the bin, we should find it inside ROOT_FOLDER
         */
        const [listDeletedManageResponse] = await manager.listDeletedCategories();
        expect(listDeletedManageResponse).toEqual({
            data: {
                listDeletedCategories: {
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            entryId: categoryToDelete.entryId,
                            deletedBy: expect.any(Object),
                            deletedOn: expect.any(String),
                            wbyAco_location: {
                                folderId: ROOT_FOLDER
                            }
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
    });
});
