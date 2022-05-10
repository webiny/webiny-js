import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "../tenancySecurity";

jest.setTimeout(100000);

describe("Block Categories CRUD Test", () => {
    const {
        createBlockCategory,
        deleteBlockCategory,
        listBlockCategories,
        getBlockCategory,
        updateBlockCategory
    } = useGqlHandler();

    test("create, read, update and delete block categories", async () => {
        // Test creating, getting and updating three block categories.
        for (let i = 0; i < 3; i++) {
            const prefix = `block-category-${i}-`;
            let data = {
                slug: `${prefix}slug`,
                name: `${prefix}name`
            };

            let [response] = await createBlockCategory({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createBlockCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });

            [response] = await getBlockCategory({ slug: data.slug });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getBlockCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });

            data = {
                slug: data.slug, // Slug cannot be changed.
                name: data.name + "-UPDATED"
            };

            [response] = await updateBlockCategory({ slug: data.slug, data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updateBlockCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show three block categories.
        let [response] = await listBlockCategories();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listBlockCategories: {
                        data: [
                            {
                                slug: "block-category-0-slug",
                                name: "block-category-0-name-UPDATED",
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            {
                                slug: "block-category-1-slug",
                                name: "block-category-1-name-UPDATED",
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            {
                                slug: "block-category-2-slug",
                                name: "block-category-2-name-UPDATED",
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // After deleting all block categories, list should be empty.
        for (let i = 0; i < 3; i++) {
            const prefix = `block-category-${i}-`;
            const data = {
                slug: `${prefix}slug`,
                name: `${prefix}name-UPDATED`
            };

            const [response] = await deleteBlockCategory({ slug: data.slug });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deleteBlockCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero categories.
        [response] = await listBlockCategories();
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    listBlockCategories: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });
});
