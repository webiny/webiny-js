import { beforeEach, describe, expect, it } from "vitest";
import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { useFruitManageHandler } from "~tests/testHelpers/useFruitManageHandler";
import type { ICategoryInputValues } from "~tests/testHelpers/category/manage/types.js";

describe("duplicate content entry", () => {
    const manager = useCategoryManageHandler({
        path: "manage"
    });

    const createCategory = async (values: ICategoryInputValues) => {
        const [response] = await manager.createCategory({
            variables: {
                data: {
                    values
                }
            }
        });
        return response.data.createCategory.data!;
    };

    const getCategory = async (revision: string) => {
        const [response] = await manager.getCategory({
            variables: {
                revision
            }
        });
        return response.data.getCategory.data!;
    };

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category", "fruit"]
        });
    });

    it("should duplicate an entry into a new draft entry", async () => {
        const category = await createCategory({
            title: "Fruits",
            slug: "fruits"
        });

        await manager.moveCategory({
            variables: {
                revision: category.id,
                folderId: "someFolder"
            }
        });

        const [response] = await manager.duplicateCategory({
            variables: {
                revision: category.id
            }
        });

        expect(response.data.duplicateCategory.error).toBeNull();
        const duplicate = response.data.duplicateCategory.data!;

        expect(duplicate.entryId).not.toEqual(category.entryId);
        expect(duplicate).toMatchObject({
            id: `${duplicate.entryId}#0001`,
            createdBy: category.createdBy,
            firstPublishedOn: null,
            lastPublishedOn: null,
            meta: {
                title: "Copy of Fruits",
                version: 1,
                locked: false,
                status: "draft",
                revisions: [
                    {
                        id: `${duplicate.entryId}#0001`
                    }
                ]
            },
            wbyAco_location: {
                folderId: "someFolder"
            },
            values: {
                title: "Copy of Fruits",
                slug: "fruits",
                separator: null
            }
        });

        /**
         * Original entry must not change.
         */
        const original = await getCategory(category.id);
        expect(original).toMatchObject({
            id: category.id,
            values: {
                title: "Fruits",
                slug: "fruits"
            },
            meta: {
                status: "draft",
                version: 1
            }
        });
    });

    it("should duplicate a published entry as a draft", async () => {
        const category = await createCategory({
            title: "Vegetables",
            slug: "vegetables"
        });
        await manager.publishCategory({
            variables: {
                revision: category.id
            }
        });

        const [response] = await manager.duplicateCategory({
            variables: {
                revision: category.id
            }
        });

        expect(response.data.duplicateCategory.error).toBeNull();
        expect(response.data.duplicateCategory.data).toMatchObject({
            firstPublishedOn: null,
            lastPublishedOn: null,
            meta: {
                version: 1,
                locked: false,
                status: "draft"
            },
            values: {
                title: "Copy of Vegetables",
                slug: "vegetables"
            }
        });

        const original = await getCategory(category.id);
        expect(original.meta.status).toEqual("published");
    });

    it("should duplicate the given (non-latest) revision only", async () => {
        const category = await createCategory({
            title: "Revision 1",
            slug: "revision-1"
        });
        const [createFromResponse] = await manager.createCategoryFrom({
            variables: {
                revision: category.id,
                data: {
                    values: {
                        title: "Revision 2",
                        slug: "revision-2"
                    }
                }
            }
        });
        expect(createFromResponse.data.createCategoryFrom.error).toBeNull();

        const [response] = await manager.duplicateCategory({
            variables: {
                revision: category.id
            }
        });

        expect(response.data.duplicateCategory.error).toBeNull();
        const duplicate = response.data.duplicateCategory.data!;
        expect(duplicate.meta.revisions).toHaveLength(1);
        expect(duplicate).toMatchObject({
            meta: {
                version: 1,
                status: "draft"
            },
            values: {
                title: "Copy of Revision 1",
                slug: "revision-1"
            }
        });
    });

    it("should return an error when the source entry does not exist", async () => {
        const [response] = await manager.duplicateCategory({
            variables: {
                revision: "nonExistingEntry#0001"
            }
        });

        expect(response.data.duplicateCategory).toMatchObject({
            data: null,
            error: {
                code: "Cms/Entry/NotFound"
            }
        });
    });

    it("should duplicate an entry with a unique field, keeping the value as-is", async () => {
        const fruitManager = useFruitManageHandler({
            path: "manage"
        });

        const [createResponse] = await fruitManager.createFruit({
            data: {
                values: {
                    name: "Apple",
                    numbers: [5, 6, 7.2, 10.18, 12.05],
                    email: "john@doe.com",
                    url: "https://webiny.com",
                    lowerCase: "lowercase",
                    upperCase: "UPPERCASE",
                    date: "2020-12-15",
                    dateTime: new Date("2020-12-15T12:12:21").toISOString(),
                    dateTimeZ: "2020-12-15T14:52:41+01:00",
                    time: "13:29:58",
                    slug: "apple"
                }
            }
        });
        expect(createResponse.data.createFruit.error).toBeNull();
        const fruit = createResponse.data.createFruit.data;

        const [response] = await fruitManager.duplicateFruit({
            revision: fruit.id
        });

        expect(response.data.duplicateFruit.error).toBeNull();
        expect(response.data.duplicateFruit.data).toMatchObject({
            meta: {
                version: 1,
                status: "draft",
                title: "Copy of Apple"
            },
            values: {
                name: "Copy of Apple",
                slug: "apple"
            }
        });
    });
});
