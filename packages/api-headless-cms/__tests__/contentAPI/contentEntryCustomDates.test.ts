import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup";

describe("content entry custom dates", () => {
    const manager = useCategoryManageHandler({
        path: "manage"
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
    });

    it("should populate entry with custom dates", async () => {
        const createValues = {
            status: "published",
            createdOn: "1997-01-01T00:00:00.000Z",
            savedOn: "1998-01-01T00:00:00.000Z",
            lastPublishedOn: "1999-01-01T00:00:00.000Z"
        };
        const [createResponse] = await manager.createCategory({
            variables: {
                data: {
                    ...createValues,
                    values: {
                        title: "Fruits",
                        slug: "fruits",
                    }
                }
            }
        });

        expect(createResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        savedOn: createValues.savedOn,
                        createdOn: createValues.createdOn,
                        lastPublishedOn: createValues.lastPublishedOn
                    },
                    error: null
                }
            }
        });
        const entryId = createResponse.data.createCategory.data!.entryId;

        const createFromValues = {
            createdOn: "1997-02-01T00:00:00.000Z",
            savedOn: "1998-02-01T00:00:00.000Z",
            lastPublishedOn: "1999-02-01T00:00:00.000Z"
        };
        const [createFromResponse] = await manager.createCategoryFrom({
            variables: {
                revision: `${entryId}#0001`,
                data: {
                    ...createFromValues
                }
            }
        });
        expect(createFromResponse).toMatchObject({
            data: {
                createCategoryFrom: {
                    data: {
                        savedOn: createFromValues.savedOn,
                        createdOn: createFromValues.createdOn,
                        lastPublishedOn: createFromValues.lastPublishedOn
                    },
                    error: null
                }
            }
        });

        const updateValues = {
            createdOn: "1997-03-01T00:00:00.000Z",
            savedOn: "1998-03-01T00:00:00.000Z",
            lastPublishedOn: "1999-03-01T00:00:00.000Z"
        };
        const [updateResponse] = await manager.updateCategory({
            variables: {
                revision: `${entryId}#0002`,
                data: {
                    ...updateValues
                }
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        savedOn: updateValues.savedOn,
                        createdOn: updateValues.createdOn,
                        lastPublishedOn: updateValues.lastPublishedOn
                    },
                    error: null
                }
            }
        });
    });
});
