import useGqlHandler from "./useGqlHandler";

describe("Menus Test", () => {
    const { createMenu, deleteMenu, listMenus, getMenu, updateMenu } = useGqlHandler();

    test("create, read, update and delete menus", async () => {
        // Test creating, getting and updating three menus.
        for (let i = 0; i < 3; i++) {
            const prefix = `menu-${i}-`;
            let data = {
                slug: `${prefix}slug`,
                title: `${prefix}title`,
                description: `${prefix}description`,
                items: { [`${prefix}items`]: "items" }
            };

            let [response] = await createMenu({ data });
            expect(response).toEqual({
                data: {
                    pageBuilder: {
                        createMenu: {
                            data,
                            error: null
                        }
                    }
                }
            });

            [response] = await getMenu({ slug: data.slug });
            expect(response).toEqual({
                data: {
                    pageBuilder: {
                        getMenu: {
                            data,
                            error: null
                        }
                    }
                }
            });

            data = {
                slug: data.slug, // Slug cannot be changed.
                title: data.title + "-UPDATED",
                description: data.description + "-UPDATED",
                items: { [`${prefix}items`]: "items-UPDATED" }
            };

            [response] = await updateMenu({ slug: data.slug, data });
            expect(response).toEqual({
                data: {
                    pageBuilder: {
                        updateMenu: {
                            data,
                            error: null
                        }
                    }
                }
            });
        }

        // List should show three menus.
        let [response] = await listMenus();
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    listMenus: {
                        data: [
                            {
                                description: "menu-0-description-UPDATED",
                                items: {
                                    "menu-0-items": "items-UPDATED"
                                },
                                slug: "menu-0-slug",
                                title: "menu-0-title-UPDATED"
                            },
                            {
                                description: "menu-1-description-UPDATED",
                                items: {
                                    "menu-1-items": "items-UPDATED"
                                },
                                slug: "menu-1-slug",
                                title: "menu-1-title-UPDATED"
                            },
                            {
                                description: "menu-2-description-UPDATED",
                                items: {
                                    "menu-2-items": "items-UPDATED"
                                },
                                slug: "menu-2-slug",
                                title: "menu-2-title-UPDATED"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // After deleting all menus, list should be empty.
        for (let i = 0; i < 3; i++) {
            const prefix = `menu-${i}-`;
            const data = {
                slug: `${prefix}slug`,
                title: `${prefix}title-UPDATED`,
                description: `${prefix}description-UPDATED`,
                items: { [`${prefix}items`]: "items-UPDATED" }
            };

            const [response] = await deleteMenu({ slug: data.slug });
            expect(response).toEqual({
                data: {
                    pageBuilder: {
                        deleteMenu: {
                            data,
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero menus.
        [response] = await listMenus();
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    listMenus: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });
});
