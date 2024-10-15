import { useSingletonCategoryHandler } from "~tests/testHelpers/useSingletonCategoryHandler";
import { createPluginFromCmsModel, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants";
// import { useHandler } from "~tests/testHelpers/useHandler";

describe("singleton model content entries", () => {
    const plugins = createPluginFromCmsModel({
        ...getCmsModel("categorySingleton"),
        tags: [CMS_MODEL_SINGLETON_TAG]
    });

    // const { handler: contextHandler } = useHandler({
    //     plugins
    // });

    const manager = useSingletonCategoryHandler({
        path: `manage/en-US`,
        plugins
    });
    const reader = useSingletonCategoryHandler({
        path: `read/en-US`,
        plugins
    });

    it("should fetch the singleton entry", async () => {
        const [managerResponse] = await manager.getCategory();

        expect(managerResponse).toEqual({
            data: {
                getCategory: {
                    data: {
                        createdBy: {
                            displayName: "John Doe",
                            id: "id-12345678",
                            type: "admin"
                        },
                        createdOn: expect.toBeDateString(),
                        deletedBy: null,
                        deletedOn: null,
                        entryId: expect.any(String),
                        firstPublishedOn: null,
                        id: expect.any(String),
                        lastPublishedOn: null,
                        modifiedBy: null,
                        modifiedOn: null,
                        restoredBy: null,
                        restoredOn: null,
                        savedBy: {
                            displayName: "John Doe",
                            id: "id-12345678",
                            type: "admin"
                        },
                        savedOn: expect.toBeDateString(),
                        slug: null,
                        title: null
                    },
                    error: null
                }
            }
        });

        const item = managerResponse.data.getCategory.data;

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

    it("should update the singleton entry", async () => {
        const data = {
            title: "New title",
            slug: "new-title"
        };
        const [managerResponse] = await manager.updateCategory({
            data
        });

        expect(managerResponse).toMatchObject({
            data: {
                updateCategory: {
                    data,
                    error: null
                }
            }
        });

        const [readerResponse] = await reader.getCategory();
        expect(readerResponse).toMatchObject({
            data: {
                getCategory: {
                    data,
                    error: null
                }
            }
        });
    });

    it("should update the singleton entry multiple times in a row", async () => {
        const [rootResponse] = await reader.getCategory();
        expect(rootResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });

        const id = rootResponse.data.getCategory.data.id;

        const data = {
            title: "New title",
            slug: "new-title"
        };
        const [response1] = await manager.updateCategory({
            data
        });
        expect(response1).toMatchObject({
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

        const [response2] = await manager.updateCategory({
            data
        });
        expect(response2).toMatchObject({
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

        const [response3] = await manager.updateCategory({
            data
        });
        expect(response3).toMatchObject({
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
    });
});
