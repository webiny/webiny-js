import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

const title = "Category Regular Identity";
const slug = "category-regular-identity";
const statusStep = "beforeTranslation";

describe("entry status step", () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: undefined
        });
    });

    it("should create a category in draft with status step and update it accordingly", async () => {
        const [result] = await manager.createCategory({
            data: {
                title,
                slug,
                statusStep
            }
        });

        expect(result).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        title,
                        slug,
                        meta: {
                            status: "draft",
                            statusStep
                        }
                    },
                    error: null
                }
            }
        });
        const id = result.data.createCategory.data.id;

        const [updateStatusStepResult] = await manager.updateCategory({
            revision: id,
            data: {
                statusStep: "afterTranslation"
            }
        });

        expect(updateStatusStepResult).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        title,
                        slug,
                        meta: {
                            status: "draft",
                            statusStep: "afterTranslation"
                        }
                    },
                    error: null
                }
            }
        });

        const [doNotTouchStatusStepResult] = await manager.updateCategory({
            revision: id,
            data: {
                title: "New Title"
            }
        });
        expect(doNotTouchStatusStepResult).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        title: "New Title",
                        slug,
                        meta: {
                            status: "draft",
                            statusStep: "afterTranslation"
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should remove a status step when publishing, unpublishing or republishing an entry", async () => {
        const [result] = await manager.createCategory({
            data: {
                title,
                slug,
                statusStep
            }
        });
        const id = result.data.createCategory.data.id;

        const [publishResult] = await manager.publishCategory({
            revision: id
        });
        expect(publishResult).toMatchObject({
            data: {
                publishCategory: {
                    data: {
                        title,
                        slug,
                        meta: {
                            status: "published",
                            statusStep: null
                        }
                    },
                    error: null
                }
            }
        });

        const [republishResult] = await manager.republishCategory({
            revision: id
        });
        expect(republishResult).toMatchObject({
            data: {
                republishCategory: {
                    data: {
                        title,
                        slug,
                        meta: {
                            status: "published",
                            statusStep: null
                        }
                    },
                    error: null
                }
            }
        });

        const [unpublishResult] = await manager.unpublishCategory({
            revision: id
        });
        expect(unpublishResult).toMatchObject({
            data: {
                unpublishCategory: {
                    data: {
                        title,
                        slug,
                        meta: {
                            status: "unpublished",
                            statusStep: null
                        }
                    },
                    error: null
                }
            }
        });
    });
});
