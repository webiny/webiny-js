import WebinyError from "@webiny/error";
import { CmsGroup, CmsModel } from "~/types";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import models from "./mocks/contentModels";

describe("Request review", () => {
    let contentModelGroup: CmsGroup;

    const manageOpts = { path: "manage/en-US" };

    const {
        until,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModel = async (model?: string | CmsModel) => {
        if (!model || typeof model === "string") {
            model = models.find(m => m.modelId === (model || "category"));
            if (!model) {
                throw new Error(`Could not find model "${model}".`);
            }
        }
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });

        const { data, error } = createCMG.data.createContentModelGroup;
        if (data) {
            contentModelGroup = data;
        } else if (error.code !== "SLUG_ALREADY_EXISTS") {
            throw new WebinyError(error.message, error.code);
        }

        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });

        if (update.errors) {
            console.error(`[beforeEach] ${update.errors[0].message}`);
            process.exit(1);
        }
        return update.data.updateContentModel.data;
    };

    test("request review, get and edit", async () => {
        await setupContentModel("category");
        const {
            createCategory,
            getCategory,
            requestCategoryReview,
            updateCategory,
            listCategories
            // storageOperations
        } = useCategoryManageHandler(manageOpts);

        const [createResponse] = await createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });
        expect(createResponse).toEqual({
            data: {
                createCategory: {
                    data: {
                        title: "Fruits",
                        slug: "fruits",
                        createdBy: expect.any(Object),
                        meta: expect.any(Object),
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        entryId: expect.any(String),
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
        const fruits: any = createResponse.data.createCategory.data;

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }: any) => {
                return data.listCategories.data.length === 1;
            },
            { name: "create category" }
        );

        const [requestReviewResponse] = await requestCategoryReview({
            revision: fruits.id
        });

        expect(requestReviewResponse).toEqual({
            data: {
                requestCategoryReview: {
                    data: {
                        ...fruits,
                        meta: {
                            ...fruits.meta,
                            revisions: fruits.meta.revisions.map((revision: any) => {
                                return {
                                    ...revision,
                                    meta: {
                                        ...revision.meta,
                                        status: "reviewRequested"
                                    }
                                };
                            }),
                            status: "reviewRequested"
                        }
                    },
                    error: null
                }
            }
        });

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }: any) => {
                if (data.listCategories.data.length !== 1) {
                    return false;
                }
                const [item] = data.listCategories.data;
                return item.meta.status === "reviewRequested";
            },
            { name: "after review requested" }
        );

        const [getResponse] = await getCategory({
            revision: fruits.id
        });

        expect(getResponse).toEqual({
            data: {
                getCategory: {
                    data: {
                        ...fruits,
                        meta: {
                            ...fruits.meta,
                            revisions: fruits.meta.revisions.map((revision: any) => {
                                return {
                                    ...revision,
                                    meta: {
                                        ...revision.meta,
                                        status: "reviewRequested",
                                        version: 1
                                    }
                                };
                            }),
                            status: "reviewRequested"
                        }
                    },
                    error: null
                }
            }
        });

        const [updateResponse] = await updateCategory({
            revision: fruits.id,
            data: {
                title: "Fruits updated",
                slug: "fruits"
            }
        });

        expect(updateResponse).toEqual({
            data: {
                updateCategory: {
                    data: {
                        ...fruits,
                        title: "Fruits updated",
                        savedOn: expect.stringMatching(/^20/),
                        meta: {
                            ...fruits.meta,
                            revisions: [
                                {
                                    ...fruits.meta.revisions[0],
                                    title: "Fruits updated",
                                    meta: {
                                        status: "reviewRequested",
                                        version: 1
                                    }
                                }
                            ],
                            title: "Fruits updated",
                            status: "reviewRequested"
                        }
                    },
                    error: null
                }
            }
        });
    });
});
