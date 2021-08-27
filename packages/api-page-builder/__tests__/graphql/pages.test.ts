import useGqlHandler from "./useGqlHandler";

jest.setTimeout(15000);

describe("CRUD Test", () => {
    const { createCategory, createPage, deletePage, listPages, getPage, updatePage, until, sleep } =
        useGqlHandler();

    test("create, read, update and delete pages", async () => {
        let [response] = await createPage({ category: "unknown" });
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    createPage: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: 'Category with slug "unknown" not found.'
                        }
                    }
                }
            }
        });

        await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const ids = [];
        // Test creating, getting and updating three pages.
        for (let i = 0; i < 3; i++) {
            const data = {
                category: "slug"
            };

            let [response] = await createPage(data);
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createPage: {
                            data: {
                                category: {
                                    slug: "slug"
                                },
                                title: "Untitled",
                                path: /^\/some-url\/untitled-.*/,
                                publishedOn: null,
                                locked: false,
                                version: 1,
                                editor: "page-builder",
                                createdOn: expect.stringMatching(/^20.*/),
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });

            let { id } = response.data.pageBuilder.createPage.data;

            ids.push(id);
            [response] = await getPage({ id });

            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getPage: {
                            data: {
                                category: {
                                    slug: "slug"
                                },
                                editor: "page-builder",
                                createdOn: /^20.*/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });

            id = response.data.pageBuilder.getPage.data.id;

            const updatePageData = {
                title: "title-UPDATED-" + i,
                path: "/path-UPDATED-" + i,
                settings: {
                    general: {
                        snippet: "snippet-UPDATED-" + i,
                        image: {
                            id: `ID#image-${i}`,
                            src: `https://someimages.com/image-${i}.png`
                        }
                    }
                }
            };

            [response] = await updatePage({
                id,
                data: updatePageData
            });

            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updatePage: {
                            data: {
                                ...data,
                                editor: "page-builder",
                                createdOn: /^20.*/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });
        }

        [response] = await until(
            () => listPages({ sort: { createdOn: "desc" } }),
            ([res]) => {
                const { data } = res.data.pageBuilder.listPages;
                return data.length === 3 && data[0].title === "title-UPDATED-2";
            }
        );

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                editor: "page-builder",
                                category: {
                                    slug: "slug"
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                savedOn: /^20/,
                                id: ids[2],
                                status: "draft",
                                title: "title-UPDATED-2",
                                path: "/path-UPDATED-2",
                                snippet: "snippet-UPDATED-2",
                                images: {
                                    general: {
                                        id: `ID#image-2`,
                                        src: `https://someimages.com/image-2.png`
                                    }
                                }
                            },
                            {
                                editor: "page-builder",
                                category: {
                                    slug: "slug"
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                savedOn: /^20/,
                                id: ids[1],
                                status: "draft",
                                title: "title-UPDATED-1",
                                path: "/path-UPDATED-1",
                                snippet: "snippet-UPDATED-1",
                                images: {
                                    general: {
                                        id: `ID#image-1`,
                                        src: `https://someimages.com/image-1.png`
                                    }
                                }
                            },
                            {
                                editor: "page-builder",
                                category: {
                                    slug: "slug"
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                savedOn: /^20/,
                                id: ids[0],
                                status: "draft",
                                title: "title-UPDATED-0",
                                path: "/path-UPDATED-0",
                                snippet: "snippet-UPDATED-0",
                                images: {
                                    general: {
                                        id: `ID#image-0`,
                                        src: `https://someimages.com/image-0.png`
                                    }
                                }
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // After deleting all pages, list should be empty.
        for (let i = 0; i < response.data.pageBuilder.listPages.data.length; i++) {
            const { id } = response.data.pageBuilder.listPages.data[i];
            const [deleteResponse] = await deletePage({ id });
            expect(deleteResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        deletePage: {
                            data: {
                                latestPage: null,
                                page: {
                                    id,
                                    editor: "page-builder",
                                    createdOn: /^20.*/,
                                    createdBy: { displayName: "m", id: "mocked" }
                                }
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero pages.
        while (response.data.pageBuilder.listPages.data.length !== 0) {
            await sleep();
            [response] = await listPages({ sort: { createdOn: "desc" } });
        }

        expect(response).toEqual({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [],
                        error: null,
                        meta: {
                            from: 0,
                            limit: 10,
                            nextPage: null,
                            page: 1,
                            previousPage: null,
                            to: 0,
                            totalCount: 0,
                            totalPages: 0
                        }
                    }
                }
            }
        });
    });

    test("get latest page with parent ID", async () => {
        await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const page = await createPage({ category: "slug" }).then(([res]) => {
            return res.data.pageBuilder.createPage.data;
        });

        const [response] = await getPage({ id: page.pid });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    getPage: {
                        data: {
                            id: page.id,
                            editor: "page-builder",
                            createdOn: /^20.*/,
                            createdBy: { displayName: "m", id: "mocked" }
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("get page with an invalid ID", async () => {
        const [response] = await getPage({ id: "invalid" });
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    getPage: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "Page not found."
                        }
                    }
                }
            }
        });
    });
});
