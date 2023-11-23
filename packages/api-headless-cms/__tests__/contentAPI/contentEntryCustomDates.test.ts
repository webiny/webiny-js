import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup";

describe("content entry custom dates", () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
    });

    it("should populate entry with custom dates", async () => {
        const createValues = {
            createdOn: "1997-01-01T00:00:00.000Z",
            savedOn: "1998-01-01T00:00:00.000Z",
            publishedOn: "1999-01-01T00:00:00.000Z"
        };
        const [createResponse] = await manager.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits",
                ...createValues
            }
        });

        expect(createResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        savedOn: createValues.savedOn,
                        createdOn: createValues.createdOn,
                        meta: {
                            publishedOn: createValues.publishedOn
                        }
                    },
                    error: null
                }
            }
        });
        const entryId = createResponse.data.createCategory.data.entryId;

        const createFromValues = {
            createdOn: "1997-02-01T00:00:00.000Z",
            savedOn: "1998-02-01T00:00:00.000Z",
            publishedOn: "1999-02-01T00:00:00.000Z"
        };
        const [createFromResponse] = await manager.createCategoryFrom({
            revision: `${entryId}#0001`,
            data: {
                ...createFromValues
            }
        });
        expect(createFromResponse).toMatchObject({
            data: {
                createCategoryFrom: {
                    data: {
                        savedOn: createFromValues.savedOn,
                        createdOn: createFromValues.createdOn,
                        meta: {
                            publishedOn: createFromValues.publishedOn
                        }
                    },
                    error: null
                }
            }
        });

        const updateValues = {
            createdOn: "1997-03-01T00:00:00.000Z",
            savedOn: "1998-03-01T00:00:00.000Z",
            publishedOn: "1999-03-01T00:00:00.000Z"
        };
        const [updateResponse] = await manager.updateCategory({
            revision: `${entryId}#0002`,
            data: {
                ...updateValues
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        savedOn: updateValues.savedOn,
                        createdOn: updateValues.createdOn,
                        meta: {
                            publishedOn: updateValues.publishedOn
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should skip updating publishedOn and savedOn when user chooses to skip the update", async () => {
        const createValues = {
            createdOn: "1997-01-01T00:00:00.000Z",
            savedOn: "1998-01-01T00:00:00.000Z",
            publishedOn: "1999-01-01T00:00:00.000Z"
        };
        const [createResponse] = await manager.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits",
                ...createValues
            }
        });
        const entryId = createResponse.data.createCategory.data.entryId;

        const [publishResponse] = await manager.publishCategory({
            revision: `${entryId}#0001`
        });
        expect(publishResponse).toMatchObject({
            data: {
                publishCategory: {
                    data: {
                        savedOn: expect.stringMatching(/^20/),
                        createdOn: createValues.createdOn,
                        meta: {
                            publishedOn: expect.stringMatching(/^20/)
                        }
                    },
                    error: null
                }
            }
        });

        const [createFromResponse] = await manager.createCategoryFrom({
            revision: `${entryId}#0001`,
            data: {
                ...createValues
            }
        });
        expect(createFromResponse).toMatchObject({
            data: {
                createCategoryFrom: {
                    data: {
                        savedOn: createValues.savedOn,
                        createdOn: createValues.createdOn,
                        meta: {
                            publishedOn: createValues.publishedOn
                        }
                    },
                    error: null
                }
            }
        });

        const [publishCreatedFromResponse] = await manager.publishCategory({
            revision: `${entryId}#0002`,
            options: {
                skipPublishedOn: true,
                skipSavedOn: true
            }
        });
        expect(publishCreatedFromResponse).toMatchObject({
            data: {
                publishCategory: {
                    data: {
                        savedOn: createValues.savedOn,
                        createdOn: createValues.createdOn,
                        meta: {
                            publishedOn: createValues.publishedOn
                        }
                    },
                    error: null
                }
            }
        });
    });
});
