import useGqlHandler from "./useGqlHandler";
import { Page } from "~/types";

jest.setTimeout(100000);

describe("listing latest pages", () => {
    const handler = useGqlHandler();

    const { createPage, publishPage, unpublishPage, listPages, updatePage, until } = handler;

    const createInitialCategory = async () => {
        const { createCategory } = useGqlHandler();
        const [createCategoryResponse] = await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });
        if (createCategoryResponse.data.pageBuilder.createCategory.error) {
            throw new Error(createCategoryResponse.data.pageBuilder.createCategory.error.message);
        }
        return createCategoryResponse.data.pageBuilder.createCategory.data;
    };

    const createInitialData = async () => {
        const pages: Page[] = [];
        const ids: string[] = [];

        const category = await createInitialCategory();

        const letters = ["a", "z", "b", "x", "c"];
        for (const letter of letters) {
            const [response] = await createPage({ category: "category" });
            const page = response.data.pageBuilder.createPage.data;

            if (response.data.pageBuilder.createPage.error) {
                throw new Error(response.data.pageBuilder.createPage.error.message);
            }

            const title = `page-${letter}`;
            const [updateResponse] = await updatePage({
                id: page.id,
                data: {
                    title
                }
            });

            if (updateResponse.data.pageBuilder.updatePage.error) {
                throw new Error(updateResponse.data.pageBuilder.updatePage.error.message);
            }

            pages.push(updateResponse.data.pageBuilder.updatePage.data);
            ids.push(updateResponse.data.pageBuilder.updatePage.data.id);
        }

        // List should show all pages - all updated.
        await until(
            () => listPages({ sort: ["createdOn_ASC"] }),
            ([res]: any) => {
                const data = res.data.pageBuilder.listPages.data;
                return (
                    data.length === pages.length &&
                    letters.every((letter: string, index: number) => {
                        return data[index].title === `page-${letter}`;
                    })
                );
            },
            {
                name: "list pages in create initial data"
            }
        );

        return {
            category,
            pages,
            ids
        };
    };

    test("sorting", async () => {
        await createInitialData();
        // 1. Check if all were returned and sorted `createdOn: asc`.
        const [listPagesResponse] = await until(
            () =>
                listPages({
                    sort: "createdOn_ASC"
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data[4].title === "page-c",
            {
                name: "list pages createdOn ASC"
            }
        );

        expect(listPagesResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-a" },
                            { title: "page-z" },
                            { title: "page-b" },
                            { title: "page-x" },
                            { title: "page-c" }
                        ]
                    }
                }
            }
        });

        // 2. Check if all were returned and sorted `title: asc`.
        const [listPagesTitleAscResponse] = await listPages({ sort: ["title_ASC"] });
        expect(listPagesTitleAscResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-a" },
                            { title: "page-b" },
                            { title: "page-c" },
                            { title: "page-x" },
                            { title: "page-z" }
                        ]
                    }
                }
            }
        });

        // 3. Check if all were returned and sorted `title: desc`.
        const [listPagesTitleDescResponse] = await listPages({ sort: ["title_DESC"] });
        expect(listPagesTitleDescResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-z" },
                            { title: "page-x" },
                            { title: "page-c" },
                            { title: "page-b" },
                            { title: "page-a" }
                        ]
                    }
                }
            }
        });
    });

    test("sorting by title must work case insensitive", async () => {
        await createInitialData();
        // 1. Let's create five pages, with all uppercase titles.
        const letters = ["A", "Z", "B", "X", "C"];
        for (const letter of letters) {
            const [res] = await createPage({ category: "category" });
            if (res.data.pageBuilder.createPage.error) {
                throw new Error(res.data.pageBuilder.createPage.error.message);
            }
            const page = res.data.pageBuilder.createPage.data;
            await updatePage({
                id: page.id,
                data: {
                    title: `page-${letter}`
                }
            });
        }

        // List should show all five pages.
        const [listTitleAscResponse] = await until(
            () => listPages({ sort: ["title_ASC", "createdOn_ASC"] }),
            ([res]: any) => {
                const { data } = res.data.pageBuilder.listPages;
                return data[0].title === "page-a" && data[9].title === "page-Z";
            },
            {
                name: "after creating new pages with uppercase titles"
            }
        );

        // Might not be an ideal order but it's what we knew at the moment of implementation. In the future,
        // if we find out how to do "page-A", "page-a", "page B", "page b", ..., we'll revisit this.
        expect(listTitleAscResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-a" },
                            { title: "page-A" },
                            { title: "page-b" },
                            { title: "page-B" },
                            { title: "page-c" },
                            { title: "page-C" },
                            { title: "page-x" },
                            { title: "page-X" },
                            { title: "page-z" },
                            { title: "page-Z" }
                        ]
                    }
                }
            }
        });
    });

    test("filtering by category", async () => {
        const { createCategory } = useGqlHandler();
        await createInitialData();
        await createCategory({
            data: {
                slug: `custom`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const letters = ["j", "n", "k", "m", "l"];
        // Test creating, getting and updating three pages.
        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i];
            const [response] = await createPage({ category: "custom" });

            const page = response.data.pageBuilder.createPage.data;

            const title = `page-${letter}`;
            await updatePage({
                id: page.id,
                data: {
                    title
                }
            });
        }

        // Just in case, ensure all ten pages are present.
        const [listPagesResponse] = await until(
            () =>
                listPages({
                    sort: ["createdOn_ASC"]
                }),
            ([res]: any) => {
                return res.data.pageBuilder.listPages.data.length === 10;
            },
            {
                name: "after create and update page in category filter"
            }
        );
        expect(listPagesResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-a" },
                            { title: "page-z" },
                            { title: "page-b" },
                            { title: "page-x" },
                            { title: "page-c" },
                            { title: "page-j" },
                            { title: "page-n" },
                            { title: "page-k" },
                            { title: "page-m" },
                            { title: "page-l" }
                        ]
                    }
                }
            }
        });

        // 1. Check if `category: custom` were returned and sorted `createdOn: desc`.
        const [listPagesWhereCustomCategory] = await until(
            () => listPages({ where: { category: "custom" }, sort: ["createdOn_ASC"] }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 5
        );

        expect(listPagesWhereCustomCategory).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-j" },
                            { title: "page-n" },
                            { title: "page-k" },
                            { title: "page-m" },
                            { title: "page-l" }
                        ]
                    }
                }
            }
        });

        // 2. Check if `category: custom` were returned and sorted `title: desc`.
        const [listPagesWhereCustomCategoryTitleDescResponse] = await until(
            () => listPages({ where: { category: "custom" }, sort: ["title_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 5
        );
        expect(listPagesWhereCustomCategoryTitleDescResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-n" },
                            { title: "page-m" },
                            { title: "page-l" },
                            { title: "page-k" },
                            { title: "page-j" }
                        ]
                    }
                }
            }
        });
    });

    test("filtering by status", async () => {
        const initialData = await createInitialData();
        // Let's publish first two pages and then only filter by `status: published`
        const [page1PublishResponse] = await publishPage({ id: initialData.pages[0].id });

        expect(page1PublishResponse).toMatchObject({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: {
                            id: initialData.pages[0].id
                        },
                        error: null
                    }
                }
            }
        });

        const [page2PublishResponse] = await publishPage({ id: initialData.pages[1].id });

        expect(page2PublishResponse).toMatchObject({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: {
                            id: initialData.pages[1].id
                        },
                        error: null
                    }
                }
            }
        });

        // We should still get all results when no filters are applied.
        // 1. Check if all were returned and sorted `createdOn: desc`.
        const [listPagesCreatedOnDesc] = await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length,
            {
                name: "list pages createdOn desc"
            }
        );
        expect(listPagesCreatedOnDesc).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-c" },
                            { title: "page-x" },
                            { title: "page-b" },
                            { title: "page-z" },
                            { title: "page-a" }
                        ]
                    }
                }
            }
        });

        // 2. We should only get two results here because we published two pages.
        const [listPagesPublishedCreatedOnDesc] = await until(
            () => listPages({ where: { status: "published" }, sort: ["createdOn_DESC"] }),
            ([res]: any) => {
                return res.data.pageBuilder.listPages.data.length === 2;
            },
            {
                name: "list published pages createdOn desc"
            }
        );

        expect(listPagesPublishedCreatedOnDesc).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [{ title: "page-z" }, { title: "page-a" }]
                    }
                }
            }
        });

        const [listPagesPublishedTitleAsc] = await until(
            () =>
                listPages({
                    sort: ["title_ASC"],
                    where: { status: "published" }
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data[0].title === "page-a",
            {
                name: "list published pages title asc"
            }
        );
        expect(listPagesPublishedTitleAsc).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [{ title: "page-a" }, { title: "page-z" }]
                    }
                }
            }
        });

        // 4. Let's unpublish first two and then again filter by `status: published`. We should not get any pages.
        await unpublishPage({ id: initialData.pages[0].id });
        await unpublishPage({ id: initialData.pages[1].id });

        const [listPagesPublishedTitleAscAfterUnpublish] = await until(
            () =>
                listPages({
                    sort: ["title_ASC"],
                    where: { status: "published" }
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 0
        );
        expect(listPagesPublishedTitleAscAfterUnpublish).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: []
                    }
                }
            }
        });
    });

    test("pagination", async () => {
        await createInitialData();
        await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 5
        );

        /**
         * We will paginate through pages from last to first
         * creation order: a, z, b, x, c
         */

        /**
         * We start by going from last page.
         * "C"
         */
        const [responseLimit1C] = await listPages({
            limit: 1,
            sort: ["createdOn_DESC"]
        });

        expect(responseLimit1C).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                title: "page-c"
                            }
                        ],
                        meta: {
                            hasMoreItems: true,
                            cursor: expect.any(String),
                            totalCount: 5
                        },
                        error: null
                    }
                }
            }
        });

        const cursorC = responseLimit1C.data.pageBuilder.listPages.meta.cursor;
        /**
         * Then we expect to load "X"
         */
        const [responseLimit1X] = await listPages({
            limit: 1,
            sort: ["createdOn_DESC"],
            after: cursorC
        });
        expect(responseLimit1X).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                title: "page-x"
                            }
                        ],
                        meta: {
                            hasMoreItems: true,
                            cursor: expect.any(String),
                            totalCount: 5
                        },
                        error: null
                    }
                }
            }
        });

        const cursorX = responseLimit1X.data.pageBuilder.listPages.meta.cursor;
        /**
         * Then we load page "B"
         */
        const [responseLimit1B] = await listPages({
            limit: 1,
            sort: ["createdOn_DESC"],
            after: cursorX
        });
        expect(responseLimit1B).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                title: "page-b"
                            }
                        ],
                        meta: {
                            hasMoreItems: true,
                            cursor: expect.any(String),
                            totalCount: 5
                        },
                        error: null
                    }
                }
            }
        });
        const cursorB = responseLimit1B.data.pageBuilder.listPages.meta.cursor;
        /**
         * Page "Z"
         */
        const [responseLimit1Z] = await listPages({
            limit: 1,
            sort: ["createdOn_DESC"],
            after: cursorB
        });

        const cursorZ = responseLimit1Z.data.pageBuilder.listPages.meta.cursor;
        /**
         * Page "A"
         * We have no pages after that.
         */
        const [responseLimit1A] = await listPages({
            limit: 1,
            sort: ["createdOn_DESC"],
            after: cursorZ
        });
        expect(responseLimit1A).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                title: "page-a"
                            }
                        ],
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 5
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Now lets try to load pages by 2
         * We start by going from last page.
         * "C" and X
         */
        const [responseLimit2CX] = await listPages({
            limit: 2,
            sort: ["createdOn_DESC"]
        });

        expect(responseLimit2CX).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                title: "page-c"
                            },
                            {
                                title: "page-x"
                            }
                        ],
                        meta: {
                            hasMoreItems: true,
                            cursor: expect.any(String),
                            totalCount: 5
                        },
                        error: null
                    }
                }
            }
        });

        const cursorCX = responseLimit2CX.data.pageBuilder.listPages.meta.cursor;
        /**
         * "C" and X
         */
        const [responseLimit2BZ] = await listPages({
            limit: 2,
            sort: ["createdOn_DESC"],
            after: cursorCX
        });

        expect(responseLimit2BZ).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                title: "page-b"
                            },
                            {
                                title: "page-z"
                            }
                        ],
                        meta: {
                            hasMoreItems: true,
                            cursor: expect.any(String),
                            totalCount: 5
                        },
                        error: null
                    }
                }
            }
        });
        const cursorBZ = responseLimit2BZ.data.pageBuilder.listPages.meta.cursor;

        /**
         * "C" and X
         */
        const [responseLimit2A] = await listPages({
            limit: 2,
            sort: ["createdOn_DESC"],
            after: cursorBZ
        });
        expect(responseLimit2A).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                title: "page-a"
                            }
                        ],
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 5
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("filtering by tags", async () => {
        const initialData = await createInitialData();
        // Just in case, ensure all pages are present.
        await until(
            () =>
                listPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]: any) => {
                return res.data.pageBuilder.listPages.data.length === initialData.pages.length;
            },
            {
                name: "filtering by tags - list pages after creating initial data"
            }
        );

        const tags = {
            [initialData.pages[0].id]: ["news", "world"],
            [initialData.pages[1].id]: ["news", "world"],
            [initialData.pages[2].id]: ["news", "local"],
            [initialData.pages[3].id]: ["news", "local"]
        };

        for (const page of initialData.pages) {
            await updatePage({
                id: page.id,
                data: {
                    settings: {
                        general: {
                            tags: tags[page.id]
                        }
                    }
                }
            });
        }

        const [listPagesWhereTagNews] = await until(
            () =>
                listPages({
                    where: {
                        tags: {
                            query: ["news"]
                        }
                    },
                    sort: ["createdOn_ASC"]
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 4,
            {
                name: "list pages where tag is new"
            }
        );

        expect(listPagesWhereTagNews).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-a" },
                            { title: "page-z" },
                            { title: "page-b" },
                            { title: "page-x" }
                        ],
                        error: null
                    }
                }
            }
        });

        await until(
            () =>
                listPages({
                    where: {
                        tags: {
                            query: ["world", "news"]
                        }
                    },
                    sort: ["createdOn_ASC"]
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 2,
            {
                name: "list tags world, news"
            }
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { title: "page-a" },
                { title: "page-z" }
            ])
        );

        await until(
            () =>
                listPages({
                    where: {
                        tags: {
                            query: ["local", "news"]
                        }
                    },
                    sort: ["createdOn_ASC"]
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 2,
            {
                name: "list tags local, news"
            }
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { title: "page-b" },
                { title: "page-x" }
            ])
        );
    });

    test("searching by text", async () => {
        const { createCategory } = useGqlHandler();
        await createInitialCategory();
        await createCategory({
            data: {
                slug: `custom`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const TITLE_SEO = "Crafting a good page title for SEO";
        const TITLE_BUY_ONLINE = "The 30 Coolest Things to Buy Online in 2020";
        const TITLE_PRACTICE_ROUTINE = "30 Minute Guitar Practice Routine";
        const TITLE_HEALTHY_RECIPES = "Our 50 Most-Popular Healthy Recipes";
        const TITLE_SERVERLESS = "What is Serverless and is it worth it?";
        const TITLE_SERVERLESS_GO = "Why should you go Serverless today?";
        const TITLE_SERVERLESS_SIDE_RENDERING = "Serverless Side Rendering — The Ultimate Guide";

        const customCategoryPages = [0, 2, 4, 6];
        const searchPages = [
            { title: TITLE_SEO }, // "custom" category
            { title: TITLE_BUY_ONLINE },
            { title: TITLE_PRACTICE_ROUTINE }, // "custom" category
            { title: TITLE_HEALTHY_RECIPES },
            { title: TITLE_SERVERLESS }, // "custom" category
            { title: TITLE_SERVERLESS_GO },
            { title: TITLE_SERVERLESS_SIDE_RENDERING } // "custom" category
        ];

        for (let i = 0; i < searchPages.length; i++) {
            const data = searchPages[i];
            const category = customCategoryPages.includes(i) ? "custom" : "category";
            const [createPageResponse] = await createPage({
                category
            });

            const page = createPageResponse.data.pageBuilder.createPage.data;

            await updatePage({
                id: page.id,
                data
            });
        }

        await until(
            () =>
                listPages({
                    search: {
                        query: "title for seo"
                    }
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data[0].title === TITLE_SEO,
            {
                name: "list pages title for seo search"
            }
        );

        await until(
            () =>
                listPages({
                    search: {
                        query: "healthy recipes"
                    }
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data[0].title === TITLE_HEALTHY_RECIPES,
            {
                name: "list pages title healthy recipes"
            }
        );

        const [listPagesSearchWhyGoServerless] = await until(
            () =>
                listPages({
                    search: {
                        query: "why go serverless"
                    },
                    sort: ["createdOn_ASC"]
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 3,
            {
                name: "list pages why go serverless"
            }
        );

        expect(listPagesSearchWhyGoServerless.data.pageBuilder.listPages.data).toMatchObject([
            { title: "What is Serverless and is it worth it?" },
            { title: "Why should you go Serverless today?" },
            { title: "Serverless Side Rendering — The Ultimate Guide" }
        ]);

        const [listPagesSearchServerlessWorthIt] = await until(
            () =>
                listPages({
                    search: {
                        query: "serverless worth it"
                    },
                    sort: ["createdOn_ASC"]
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 3,
            {
                name: "list pages serverless worth it"
            }
        );

        expect(listPagesSearchServerlessWorthIt.data.pageBuilder.listPages.data).toMatchObject([
            { title: "What is Serverless and is it worth it?" },
            { title: "Why should you go Serverless today?" },
            { title: "Serverless Side Rendering — The Ultimate Guide" }
        ]);

        // This should return two pages since we're only looking in the "custom" category.
        const [listPagesCustomCategoryServerlessWorthIt] = await until(
            () =>
                listPages({
                    where: {
                        category: "custom"
                    },
                    search: {
                        query: "serverless worth it"
                    },
                    sort: ["createdOn_ASC"]
                }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 2
        );

        expect(
            listPagesCustomCategoryServerlessWorthIt.data.pageBuilder.listPages.data
        ).toMatchObject([
            { title: "What is Serverless and is it worth it?" },
            { title: "Serverless Side Rendering — The Ultimate Guide" }
        ]);
    });
});
