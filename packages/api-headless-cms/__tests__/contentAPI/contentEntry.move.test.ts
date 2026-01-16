import { beforeEach, describe, expect, it } from "vitest";
import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import type {
    ICategoryInputValues,
    ICategoryResponseValues
} from "~tests/testHelpers/category/manage/types.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

describe("move content entry to another folder", () => {
    const manager = useCategoryManageHandler({
        path: "manage"
    });

    const getCategory = async (revision: string) => {
        return await manager
            .getCategory({
                variables: {
                    revision
                }
            })
            .then(result => {
                const [data] = result;
                return data.data.getCategory.data!;
            });
    };

    const createCategory = async (values: ICategoryInputValues) => {
        return await manager
            .createCategory({
                variables: {
                    data: {
                        values
                    }
                }
            })
            .then(result => {
                const [data] = result;
                return data.data.createCategory.data!;
            });
    };

    const createCategoryFrom = async (
        category: IManageQueryBaseResponse<ICategoryResponseValues>
    ) => {
        return await manager
            .createCategoryFrom({
                variables: {
                    revision: category.id
                }
            })
            .then(result => {
                const [data] = result;
                return data.data.createCategoryFrom.data!;
            });
    };

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
    });

    it("should move content entry to another folder", async () => {
        const category = await createCategory({
            title: "Fruits",
            slug: "fruits"
        });
        expect(category).toMatchObject({
            id: expect.any(String),
            values: {
                title: "Fruits",
                slug: "fruits"
            },
            wbyAco_location: {
                folderId: "root"
            }
        });

        const [moveResponse] = await manager.moveCategory({
            variables: {
                revision: category.id,
                folderId: "anotherFolder"
            }
        });
        expect(moveResponse).toEqual({
            data: {
                moveCategory: {
                    data: true,
                    error: null
                }
            }
        });

        const getCategoryResponse = await getCategory(category.id);
        expect(getCategoryResponse).toMatchObject({
            id: category.id,
            values: {
                title: category.values.title,
                slug: category.values.slug
            },
            wbyAco_location: {
                folderId: "anotherFolder"
            }
        });

        const [listCategoriesResponse] = await manager.listCategories();
        expect(listCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category.id,
                            values: category.values,
                            wbyAco_location: {
                                folderId: "anotherFolder"
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });
    });

    it("should move content entry and all its revisions to another folder", async () => {
        const category = await createCategory({
            title: "Fruits",
            slug: "fruits"
        });
        expect(category).toMatchObject({
            id: expect.any(String),
            values: {
                title: "Fruits",
                slug: "fruits"
            }
        });
        const category2 = await createCategoryFrom(category);
        expect(category2).toMatchObject({
            id: `${category.entryId}#0002`,
            values: {
                title: "Fruits",
                slug: "fruits"
            }
        });
        const category3 = await createCategoryFrom(category);
        expect(category3).toMatchObject({
            id: `${category.entryId}#0003`,
            values: {
                title: "Fruits",
                slug: "fruits"
            }
        });
        const category4 = await createCategoryFrom(category);
        expect(category4).toMatchObject({
            id: `${category.entryId}#0004`,
            values: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        const [moveResponse] = await manager.moveCategory({
            variables: {
                revision: category4.id,
                folderId: "yetAnotherFolder"
            }
        });
        expect(moveResponse).toEqual({
            data: {
                moveCategory: {
                    data: true,
                    error: null
                }
            }
        });
        const getCategoryResponse = await getCategory(category.id);
        expect(getCategoryResponse).toMatchObject({
            id: category.id,
            values: category.values,
            wbyAco_location: {
                folderId: "yetAnotherFolder"
            }
        });

        const getCategory2Response = await getCategory(category2.id);
        expect(getCategory2Response).toMatchObject({
            id: category2.id,
            values: category2.values,
            wbyAco_location: {
                folderId: "yetAnotherFolder"
            }
        });

        const getCategory3Response = await getCategory(category3.id);
        expect(getCategory3Response).toMatchObject({
            id: category3.id,
            values: category3.values,
            wbyAco_location: {
                folderId: "yetAnotherFolder"
            }
        });
        const getCategory4Response = await getCategory(category4.id);
        expect(getCategory4Response).toMatchObject({
            id: category4.id,
            values: category4.values,
            wbyAco_location: {
                folderId: "yetAnotherFolder"
            }
        });

        const [listCategoriesResponse] = await manager.listCategories();
        expect(listCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category4.id,
                            values: category4.values,
                            wbyAco_location: {
                                folderId: "yetAnotherFolder"
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });
    });
});
