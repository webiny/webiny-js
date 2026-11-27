import { describe, expect, it } from "vitest";
import { useSingletonCategoryHandler } from "~tests/testHelpers/useSingletonCategoryHandler";
import { createPluginFromCmsModel, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants";

const baseModel = getCmsModel("categorySingleton");

describe("singleton model content entries", () => {
    const plugins = createPluginFromCmsModel({
        ...baseModel,
        tags: [CMS_MODEL_SINGLETON_TAG]
    });

    const manager = useSingletonCategoryHandler({
        path: `manage/en-US`,
        plugins
    });
    const reader = useSingletonCategoryHandler({
        path: `read/en-US`,
        plugins
    });
    const previewer = useSingletonCategoryHandler({
        path: `preview/en-US`,
        plugins
    });

    it("should create and fetch the latest singleton entry", async () => {
        const [managerResponse] = await manager.getCategoryLatest();

        expect(managerResponse).toMatchObject({
            data: {
                getCategoryLatest: {
                    data: {
                        createdBy: {
                            displayName: "John Doe",
                            id: "id-12345678",
                            type: "admin"
                        },
                        createdOn: expect.toBeDateString(),
                        entryId: expect.any(String),
                        firstPublishedOn: null,
                        id: expect.stringMatching(/#0001$/),
                        lastPublishedOn: null,
                        values: {
                            slug: null,
                            title: null
                        },
                        meta: {
                            version: 1,
                            locked: false,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });

        const { meta, revisionDescription, ...item } = managerResponse.data.getCategoryLatest.data;
        expect(meta).toBeTruthy();
        expect(revisionDescription).toBeDefined();

        const [readerResponse] = await reader.getCategory();
        expect(readerResponse).toEqual({
            data: {
                getCategory: {
                    data: item,
                    error: null
                }
            }
        });
    });

    it("should update the singleton entry and return it on read and preview", async () => {
        const [latestResponse] = await manager.getCategoryLatest();
        const id = latestResponse.data.getCategoryLatest.data.id;
        expect(id).toMatch(/#0001$/);

        const data = {
            values: {
                title: "New title",
                slug: "new-title"
            }
        };
        const [managerResponse] = await manager.updateCategory(id, data);

        expect(managerResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        ...data,
                        id
                    },
                    error: null
                }
            }
        });

        const [readerResponse] = await reader.getCategory();
        expect(readerResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...data,
                        id
                    },
                    error: null
                }
            }
        });

        const [previewResponse] = await previewer.getCategory();
        expect(previewResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...data,
                        id
                    },
                    error: null
                }
            }
        });
    });

    it("should update the singleton entry multiple times in a row", async () => {
        const [latestResponse] = await manager.getCategoryLatest();
        const id = latestResponse.data.getCategoryLatest.data.id;

        const [response1] = await manager.updateCategory(id, {
            values: { title: "First", slug: "first" }
        });
        expect(response1.data.updateCategory).toMatchObject({
            data: { id, values: { title: "First" } },
            error: null
        });

        const [response2] = await manager.updateCategory(id, {
            values: { title: "Second", slug: "second" }
        });
        expect(response2.data.updateCategory).toMatchObject({
            data: { id, values: { title: "Second" } },
            error: null
        });

        const [response3] = await manager.updateCategory(id, {
            values: { title: "Third", slug: "third" }
        });
        expect(response3.data.updateCategory).toMatchObject({
            data: { id, values: { title: "Third" } },
            error: null
        });

        const [readerResponse] = await reader.getCategory();
        expect(readerResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id,
                        values: { title: "Third" }
                    },
                    error: null
                }
            }
        });
    });

    it("should not have the manage get query without arguments", async () => {
        const [response] = await manager.getCategory();

        expect(response.errors?.[0]?.message).toContain(
            `Cannot query field "get${baseModel.singularApiName}" on type "Query"`
        );
    });
});
