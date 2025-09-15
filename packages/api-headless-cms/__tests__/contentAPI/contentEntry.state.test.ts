import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

const title = "Category Regular Identity";
const slug = "category-regular-identity";
const stateName = "beforeTranslation";

describe("entry state", () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
    });

    it("should create a category in draft with state status and update it accordingly", async () => {
        const [result] = await manager.createCategory({
            data: {
                title,
                slug,
                state: {
                    name: stateName
                }
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
                            state: {
                                name: stateName,
                                comment: null
                            }
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
                state: {
                    name: "afterTranslation",
                    comment: "Translated to Spanish"
                }
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
                            state: {
                                name: "afterTranslation",
                                comment: "Translated to Spanish"
                            }
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
                            state: {
                                name: "afterTranslation",
                                comment: "Translated to Spanish"
                            }
                        }
                    },
                    error: null
                }
            }
        });

        const [listByStateNameResult] = await manager.listCategories({
            where: {
                state: {
                    name: "afterTranslation"
                }
            }
        });

        expect(listByStateNameResult).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "New Title",
                            slug,
                            meta: {
                                status: "draft",
                                state: {
                                    name: "afterTranslation",
                                    comment: "Translated to Spanish"
                                }
                            }
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    it("should remove a state status when publishing, unpublishing or republishing an entry", async () => {
        const [result] = await manager.createCategory({
            data: {
                title,
                slug,
                state: {
                    name: stateName
                }
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
                            state: {
                                name: null,
                                comment: null
                            }
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
                            state: {
                                name: null,
                                comment: null
                            }
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
                            state: {
                                name: null,
                                comment: null
                            }
                        }
                    },
                    error: null
                }
            }
        });
    });
});
