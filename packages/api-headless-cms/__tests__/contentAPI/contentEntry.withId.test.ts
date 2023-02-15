/**
 * This test determines that a user can send a custom ID when creating a content entry.
 * The rest of functionality and limitations remain the same.
 */
import { setupContentModelGroup, setupContentModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { useCategoryReadHandler } from "~tests/testHelpers/useCategoryReadHandler";
interface Category {
    id: string;
    title: string;
    slug: string;
}
const createCategory = (input?: Partial<Category>): Category => {
    return {
        id: "61b48412-d616-4f36-babd-4c6a67d7bd03",
        title: "Category with defined ID",
        slug: "category-with-defined-id",
        ...input
    };
};

describe("Content entry with user defined ID", () => {
    const handler = useCategoryManageHandler({
        path: "manage/en-US"
    });
    const readHandler = useCategoryReadHandler({
        path: "read/en-US"
    });

    beforeEach(async () => {
        const group = await setupContentModelGroup(handler);
        await setupContentModels(handler, group, ["category"]);
    });

    it("should create, update, publish, unpublish and delete an entry with the given user defined ID", async () => {
        const category = createCategory();

        /**
         * Create entry and check that it really is created.
         */
        const [createResponse] = await handler.createCategory({
            data: category
        });

        const id = `${category.id}#0001`;
        expect(createResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        ...category,
                        entryId: category.id,
                        id
                    },
                    error: null
                }
            }
        });

        await handler.until(
            () => {
                return handler.listCategories().then(([data]) => data);
            },
            ({ data }) => {
                const entry = data.listCategories.data[0];
                return entry.id === id;
            },
            {
                name: "list categories after create"
            }
        );

        const [getAfterCreateResponse] = await handler.getCategory({
            revision: id
        });
        expect(getAfterCreateResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        entryId: category.id,
                        id,
                        meta: {
                            version: 1,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });

        /**
         * Update entry and check that it really is updated.
         */
        const updatedTitle = "Updated category with defined ID";
        const [updateResponse] = await handler.updateCategory({
            revision: id,
            data: {
                title: updatedTitle,
                slug: category.slug
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        ...category,
                        entryId: category.id,
                        id,
                        title: updatedTitle,
                        meta: {
                            version: 1,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });

        await handler.until(
            () => {
                return handler.listCategories().then(([data]) => data);
            },
            ({ data }) => {
                const entry = data.listCategories.data[0];
                if (entry.title !== updatedTitle) {
                    return false;
                }
                return entry.id === id;
            },
            {
                name: "list categories after update"
            }
        );

        const [getAfterUpdateResponse] = await handler.getCategory({
            revision: id
        });
        expect(getAfterUpdateResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
                        entryId: category.id,
                        id,
                        meta: {
                            version: 1,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });

        /**
         * Publish entry and check that it really is published.
         */
        const [publishResponse] = await handler.publishCategory({
            revision: id
        });
        expect(publishResponse).toMatchObject({
            data: {
                publishCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
                        id,
                        entryId: category.id,
                        meta: {
                            version: 1,
                            status: "published"
                        }
                    },
                    error: null
                }
            }
        });

        await handler.until(
            () => {
                return handler.listCategories().then(([data]) => data);
            },
            ({ data }) => {
                const entry = data.listCategories.data[0];
                if (entry.title !== updatedTitle) {
                    return false;
                } else if (entry.meta.status !== "published") {
                    return false;
                }
                return entry.id === id;
            },
            {
                name: "list categories after published"
            }
        );
        await handler.until(
            () => {
                return readHandler.listCategories().then(([data]) => data);
            },
            ({ data }) => {
                const entry = data.listCategories.data[0];
                if (entry.title !== updatedTitle) {
                    return false;
                }
                return entry.id === id;
            },
            {
                name: "[READ] list categories after published"
            }
        );

        const [getAfterPublishResponse] = await handler.getCategory({
            revision: id
        });
        expect(getAfterPublishResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
                        entryId: category.id,
                        id,
                        meta: {
                            version: 1,
                            status: "published"
                        }
                    },
                    error: null
                }
            }
        });
        /**
         * After publishing, we should not be able to update the entry.
         */
        const [updateAfterPublishResponse] = await handler.updateCategory({
            revision: id,
            data: {
                title: "This should not work",
                slug: "this-should-not-work"
            }
        });
        expect(updateAfterPublishResponse).toEqual({
            data: {
                updateCategory: {
                    data: null,
                    error: {
                        code: "CONTENT_ENTRY_UPDATE_ERROR",
                        message: "Cannot update entry because it's locked.",
                        data: null
                    }
                }
            }
        });

        /**
         * Unpublish the entry and check that it really is unpublished.
         */
        const [unpublishResponse] = await handler.unpublishCategory({
            revision: id
        });
        expect(unpublishResponse).toMatchObject({
            data: {
                unpublishCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
                        id,
                        entryId: category.id,
                        meta: {
                            version: 1,
                            status: "unpublished"
                        }
                    },
                    error: null
                }
            }
        });

        await handler.until(
            () => {
                return handler.listCategories().then(([data]) => data);
            },
            ({ data }) => {
                const entry = data.listCategories.data[0];
                if (entry.title !== updatedTitle) {
                    return false;
                } else if (entry.meta.status !== "unpublished") {
                    return false;
                }
                return entry.id === id;
            },
            {
                name: "list categories after unpublished"
            }
        );
        await handler.until(
            () => {
                return readHandler.listCategories().then(([data]) => data);
            },
            ({ data }) => {
                return data.listCategories.data.length === 0;
            },
            {
                name: "[READ] list categories after unpublished"
            }
        );

        const [getAfterUnpublishResponse] = await handler.getCategory({
            revision: id
        });
        expect(getAfterUnpublishResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
                        entryId: category.id,
                        id,
                        meta: {
                            version: 1,
                            status: "unpublished"
                        }
                    },
                    error: null
                }
            }
        });
        /**
         * After unpublishing, we should not be able to update the entry.
         */
        const [updateAfterUnpublishResponse] = await handler.updateCategory({
            revision: id,
            data: {
                title: "This should not work",
                slug: "this-should-not-work"
            }
        });
        expect(updateAfterUnpublishResponse).toEqual({
            data: {
                updateCategory: {
                    data: null,
                    error: {
                        code: "CONTENT_ENTRY_UPDATE_ERROR",
                        message: "Cannot update entry because it's locked.",
                        data: null
                    }
                }
            }
        });
    });

    const malformedIds: [string][] = [
        ["-malformed-id"],
        ["malformed-id-"],
        ["-malformed-id-"],
        ["malformed-id-č"],
        ["malformed-id-ć"],
        ["malformed-id-š"],
        ["malformed-id-đ"],
        ["malformed-id-ž"],
        ["malformed-id-Č"],
        ["malformed-id-Ć"],
        ["malformed-id-Š"],
        ["malformed-id-Đ"],
        ["malformed-id-Ž"],
        ["malformed-id-!"],
        ["malformed-id-@"],
        ["malformed-id-#"],
        ["malformed-id-$"],
        ["malformed-id-%"],
        ["malformed-id-^"],
        ["malformed-id-&"],
        ["malformed-id-*"],
        ["malformed-id-("],
        ["malformed-id-)"],
        ["malformed-id-+"],
        ["malformed-id-="],
        ["malformed-id-{"],
        ["malformed-id-}"],
        ["malformed-id-["],
        ["malformed-id-]"],
        ["malformed-id-:"],
        ["malformed-id-;"],
        ["malformed-id-<"],
        ["malformed-id->"],
        ["malformed-id-,"],
        ["malformed-id-."],
        ["malformed-id-?"],
        ["malformed-id-|"],
        ["malformed-id-`"],
        ["malformed-id-~"],
        ["malformed-id- "],
        ["malfo rmed id"]
    ];

    it.each(malformedIds)(
        "should not allow to create an entry with malformed ID - %s",
        async id => {
            const category = createCategory({
                id
            });

            const [response] = await handler.createCategory({
                data: {
                    ...category
                }
            });
            expect(response).toEqual({
                data: {
                    createCategory: {
                        data: null,
                        error: {
                            code: "INVALID_ID",
                            data: {
                                id
                            },
                            message:
                                "The provided ID is not valid. It must be a string which can A-Z, a-z, 0-9, - and it cannot start or end with a -."
                        }
                    }
                }
            });
        }
    );
});
