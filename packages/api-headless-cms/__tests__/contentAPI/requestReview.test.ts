import Error from "@webiny/error";
import { CmsContentModelGroup } from "~/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import models from "./mocks/contentModels";

jest.setTimeout(15000);

describe("Request review", () => {
    let contentModelGroup: CmsContentModelGroup;

    const manageOpts = { path: "manage/en-US" };

    const {
        until,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModel = async (model = null) => {
        if (!model || typeof model === "string") {
            model = models.find(m => m.modelId === (model || "category"));
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
            throw new Error(error.message, error.code);
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
    };

    test("request review, get and edit", async () => {
        await setupContentModel("category");
        const {
            createCategory,
            getCategory,
            requestCategoryReview,
            updateCategory,
            listCategories
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
        const fruits = createResponse.data.createCategory.data;

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }) => {
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
                            status: "reviewRequested"
                        }
                    },
                    error: null
                }
            }
        });

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }) => {
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
                                    title: "Fruits updated"
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
