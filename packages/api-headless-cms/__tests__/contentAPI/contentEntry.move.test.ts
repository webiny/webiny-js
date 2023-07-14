import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";

interface CategoryParams {
    title: string;
    slug: string;
}

interface Category {
    id: string;
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
            id: category.id,
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

        const [getCategoryResponse] = await manager.getCategory({
            revision: category.id
        });
        expect(getCategoryResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id: category.id,
                        title: category.title,
                        slug: category.slug,
                        wbyAco_location: {
                            folderId: "anotherFolder"
                        }
                    },
                    error: null
                }
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
});
