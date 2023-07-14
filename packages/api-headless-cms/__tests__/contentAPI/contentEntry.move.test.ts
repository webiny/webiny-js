import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";

interface CategoryParams {
    title: string;
    slug: string;
}

interface Category {
    id: string;
    entryId: string;
    title: string;
    slug: string;
    wbyAco_location: {
        folderId: string;
    };
}

describe("move content entry to another folder", () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });

    const getCategory = async (revision: string): Promise<Category> => {
        return await manager
            .getCategory({
                revision
            })
            .then(result => {
                const [data] = result;
                return data.data.getCategory.data;
            });
    };

    const createCategory = async (data: CategoryParams): Promise<Category> => {
        return await manager
            .createCategory({
                data
            })
            .then(result => {
                const [data] = result;
                return data.data.createCategory.data;
            });
    };

    const createCategoryFrom = async (category: Category) => {
        return await manager
            .createCategoryFrom({
                revision: category.id
            })
            .then(result => {
                const [data] = result;
                return data.data.createCategoryFrom.data;
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
            title: "Fruits",
            slug: "fruits",
            wbyAco_location: {
                folderId: "root"
            }
        });

        const [moveResponse] = await manager.moveCategory({
            revision: category.id,
            folderId: "anotherFolder"
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
            title: category.title,
            slug: category.slug,
            wbyAco_location: {
                folderId: "anotherFolder"
            }
        });

        const [listCategoriesResponse] = await manager.listCategories({});
        expect(listCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category.id,
                            title: category.title,
                            slug: category.slug,
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
            title: "Fruits",
            slug: "fruits"
        });
        const category2 = await createCategoryFrom(category);
        expect(category2).toMatchObject({
            id: `${category.entryId}#0002`,
            title: "Fruits",
            slug: "fruits"
        });
        const category3 = await createCategoryFrom(category);
        expect(category3).toMatchObject({
            id: `${category.entryId}#0003`,
            title: "Fruits",
            slug: "fruits"
        });
        const category4 = await createCategoryFrom(category);
        expect(category4).toMatchObject({
            id: `${category.entryId}#0004`,
            title: "Fruits",
            slug: "fruits"
        });

        const [moveResponse] = await manager.moveCategory({
            revision: category4.id,
            folderId: "yetAnotherFolder"
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
            title: category.title,
            slug: category.slug,
            wbyAco_location: {
                folderId: "yetAnotherFolder"
            }
        });

        const getCategory2Response = await getCategory(category2.id);
        expect(getCategory2Response).toMatchObject({
            id: category2.id,
            title: category2.title,
            slug: category2.slug,
            wbyAco_location: {
                folderId: "yetAnotherFolder"
            }
        });

        const getCategory3Response = await getCategory(category3.id);
        expect(getCategory3Response).toMatchObject({
            id: category3.id,
            title: category3.title,
            slug: category3.slug,
            wbyAco_location: {
                folderId: "yetAnotherFolder"
            }
        });
        const getCategory4Response = await getCategory(category4.id);
        expect(getCategory4Response).toMatchObject({
            id: category4.id,
            title: category4.title,
            slug: category4.slug,
            wbyAco_location: {
                folderId: "yetAnotherFolder"
            }
        });

        const [listCategoriesResponse] = await manager.listCategories({});
        expect(listCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category4.id,
                            title: category4.title,
                            slug: category4.slug,
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
