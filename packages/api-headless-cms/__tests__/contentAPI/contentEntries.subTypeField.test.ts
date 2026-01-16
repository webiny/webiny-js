import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

describe("content entries with subtype field", () => {
    const manageOpts = {
        path: "manage/en-US"
    };

    const manager = useCategoryManageHandler(manageOpts);
    
    const { createCategory, listCategories } = manager;
    

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
    });

    it("should handle subtype fields correctly", async () => {
        const [createResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Test Category",
                        slug: "test-category",
                        separator: "This is a separator"
                    }
                }
            }
        });
        expect(createResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        id: expect.any(String),
                        values: {
                            title: "Test Category",
                            slug: "test-category",
                            separator: "This is a separator"
                        }
                    },
                    error: null
                }
            }
        });

        const [listResponse] = await listCategories();
        expect(listResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: expect.any(String),
                            values: {
                                title: "Test Category",
                                slug: "test-category",
                                separator: "This is a separator"
                            }
                        }
                    ],
                    error: null
                }
            }
        });
    });
});
