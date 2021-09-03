import useGqlHandler from "./useGqlHandler";
import { identityB } from "./mocks";

describe("listing latest pages", () => {
    const {
        createCategory,
        createPage,
        publishPage,
        unpublishPage,
        requestReview,
        listPages,
        updatePage,
        until
    } = useGqlHandler();

    let initiallyCreatedPagesIds;

    beforeEach(async () => {
        initiallyCreatedPagesIds = [];
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const letters = ["a", "z", "b", "x", "c"];
        for (let i = 0; i < 5; i++) {
            const [response] = await createPage({ category: "category" });
            const page = response.data.pageBuilder.createPage.data;

            if (response.data.pageBuilder.createPage.error) {
                throw new Error(response.data.pageBuilder.createPage.error);
            }

            const title = `page-${letters[i]}`;
            const [updateResponse] = await updatePage({
                id: page.id,
                data: {
                    title
                }
            });

            if (updateResponse.data.pageBuilder.createPage.error) {
                throw new Error(updateResponse.data.pageBuilder.updatePage.error);
            }

            initiallyCreatedPagesIds.push(page.id);
        }

        // List should show all five pages - all updated.
        await until(
            () => listPages({ sort: "createdOn_ASC" }),
            ([res]) => {
                const data = res.data.pageBuilder.listPages.data;
                return (
                    data.length === 5 &&
                    letters.every((letter: string, index: number) => {
                        return data[index].title === `page-${letter}`;
                    })
                );
            },
            {
                name: "list pages in before each",
                tries: 20,
                wait: 400
            }
        );
    });

    test("sorting", async () => {
        // 1. Check if all were returned and sorted `createdOn: asc`.
        await until(
            () =>
                listPages({
                    sort: "createdOn_ASC"
                }),
            ([res]) => res.data.pageBuilder.listPages.data[4].title === "page-c",
            {
                name: "list pages createdOn ASC"
            }
        ).then(([res]) =>
            expect(res).toMatchObject({
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
            })
        );

        // 2. Check if all were returned and sorted `title: asc`.
        await listPages({ sort: ["title_ASC"] }).then(([res]) =>
            expect(res).toMatchObject({
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
            })
        );

        // 3. Check if all were returned and sorted `title: desc`.
        await listPages({ sort: ["title_DESC"] }).then(([res]) =>
            expect(res).toMatchObject({
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
            })
        );
    });

    test("sorting by title must work case insensitive", async () => {
        // 1. Let's create five pages, with all uppercase titles.
        const letters = ["A", "Z", "B", "X", "C"];
        for (let i = 0; i < 5; i++) {
            createPage({ category: "category" }).then(([res]) =>
                updatePage({
                    id: res.data.pageBuilder.createPage.data.id,
                    data: {
                        title: `page-${letters[i]}`
                    }
                })
            );
        }

        // List should show all five pages.
        await until(
            () => listPages({ sort: ["title_ASC"] }),
            ([res]) => {
                const { data } = res.data.pageBuilder.listPages;
                return data[0].title === "page-a" && data[9].title === "page-Z";
            }
        ).then(([res]) =>
            // Might not be an ideal order but it's what we knew at the moment of implementation. In the future,
            // if we find out how to do "page-A", "page-a", "page B", "page b", ..., we'll revisit this.
            expect(res).toMatchObject({
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
            })
        );
    });

    test("filtering by category", async () => {
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
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letter}`
                }
            });
        }

        // Just in case, ensure all ten pages are present.
        await until(listPages, ([res]) => {
            const list = res.data.pageBuilder.listPages.data;
            return list.length === 10 && list[0].title === "page-a" && list[9].title === "page-l";
        }).then(([res]) =>
            expect(res).toMatchObject({
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
            })
        );

        // 1. Check if `category: custom` were returned and sorted `createdOn: desc`.
        await until(
            () => listPages({ where: { category: "custom" } }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 5
        ).then(([res]) =>
            expect(res).toMatchObject({
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
            })
        );

        // 2. Check if `category: custom` were returned and sorted `title: asc`.
        await until(
            () => listPages({ where: { category: "custom" }, sort: ["title_ASC"] }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 5
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [
                                { title: "page-j" },
                                { title: "page-k" },
                                { title: "page-l" },
                                { title: "page-m" },
                                { title: "page-n" }
                            ]
                        }
                    }
                }
            })
        );
    });

    test("filtering by status", async () => {
        // Let's publish first two pages and then only filter by `status: published`
        await publishPage({ id: initiallyCreatedPagesIds[0] });
        await publishPage({ id: initiallyCreatedPagesIds[1] });

        // We should still get all results when no filters are applied.
        // 1. Check if all were returned and sorted `createdOn: desc`.
        await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]) => res.data.pageBuilder.listPages.data.length
        ).then(([res]) =>
            expect(res).toMatchObject({
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
            })
        );

        // 2. We should only get two results here because we published two pages.
        await until(
            () => listPages({ where: { status: "published" }, sort: ["createdOn_DESC"] }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [{ title: "page-z" }, { title: "page-a" }]
                        }
                    }
                }
            })
        );

        await until(
            () =>
                listPages({
                    sort: ["title_ASC"],
                    where: { status: "published" }
                }),
            ([res]) => res.data.pageBuilder.listPages.data[0].title === "page-a"
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [{ title: "page-a" }, { title: "page-z" }]
                        }
                    }
                }
            })
        );

        // 4. Let's unpublish first two and then again filter by `status: published`. We should not get any pages.
        await unpublishPage({ id: initiallyCreatedPagesIds[0] });
        await unpublishPage({ id: initiallyCreatedPagesIds[1] });

        await until(
            () =>
                listPages({
                    sort: ["title_ASC"],
                    where: { status: "published" }
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 0
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: []
                        }
                    }
                }
            })
        );

        // 5. Let's test filtering by `reviewRequested` and `changesNeeded` statuses.
        await requestReview({ id: initiallyCreatedPagesIds[2] });
        await requestReview({ id: initiallyCreatedPagesIds[3] });

        await until(
            () =>
                listPages({
                    where: { status: "reviewRequested" },
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [
                                { title: "page-x", status: "reviewRequested" },
                                { title: "page-b", status: "reviewRequested" }
                            ]
                        }
                    }
                }
            })
        );

        const { requestChanges } = useGqlHandler({
            identity: identityB
        });

        await requestChanges({ id: initiallyCreatedPagesIds[2] });
        await requestChanges({ id: initiallyCreatedPagesIds[3] });

        await until(
            () =>
                listPages({
                    where: { status: "reviewRequested" }
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 0
        );

        await until(
            () =>
                listPages({
                    where: { status: "changesRequested" },
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [
                                { title: "page-x", status: "changesRequested" },
                                { title: "page-b", status: "changesRequested" }
                            ]
                        }
                    }
                }
            })
        );
    });

    test("pagination", async () => {
        await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 5
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.meta).toEqual({
                cursor: null,
                hasMoreItems: false,
                totalCount: 5
            })
        );

        await until(
            () => listPages({ limit: 1, sort: ["createdOn_DESC"] }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 1
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPages.data[0].title).toBe("page-c");
            expect(res.data.pageBuilder.listPages.meta).toEqual({
                hasMoreItems: true,
                totalCount: 5,
                cursor: expect.any(String)
            });
        });

        await until(
            () => listPages({ page: 3, limit: 1, sort: ["createdOn_DESC"] }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 1
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPages.data[0].title).toBe("page-b");
            expect(res.data.pageBuilder.listPages.meta).toEqual({
                hasMoreItems: true,
                totalCount: 5,
                cursor: expect.any(String)
            });
        });

        await until(
            () => listPages({ page: 5, limit: 1, sort: ["createdOn_DESC"] }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 1
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPages.data[0].title).toBe("page-a");
            expect(res.data.pageBuilder.listPages.meta).toEqual({
                hasMoreItems: false,
                cursor: null,
                totalCount: 5
            });
        });

        await until(
            () => listPages({ page: 2, limit: 2, sort: ["title_ASC"] }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) => {
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [{ title: "page-c" }, { title: "page-x" }]
                        }
                    }
                }
            });
            expect(res.data.pageBuilder.listPages.meta).toEqual({
                totalCount: 5,
                hasMoreItems: false,
                cursor: null
            });
        });

        await until(
            () => listPages({ page: 3, limit: 2, sort: ["title_DESC"] }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 1
        ).then(([res]) => {
            {
                expect(res).toMatchObject({
                    data: {
                        pageBuilder: {
                            listPages: {
                                data: [{ title: "page-a" }]
                            }
                        }
                    }
                });
                expect(res.data.pageBuilder.listPages.meta).toEqual({
                    totalCount: 5,
                    cursor: null,
                    hasMoreItems: false
                });
            }
        });
    });

    test("filtering by tags", async () => {
        // Just in case, ensure all pages are present.
        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data.length === 5);

        const tags = {
            [initiallyCreatedPagesIds[0]]: ["news", "world"],
            [initiallyCreatedPagesIds[1]]: ["news", "world"],
            [initiallyCreatedPagesIds[2]]: ["news", "local"],
            [initiallyCreatedPagesIds[3]]: ["news", "local"]
        };

        for (let i = 0; i < initiallyCreatedPagesIds.length; i++) {
            await updatePage({
                id: initiallyCreatedPagesIds[i],
                data: {
                    settings: {
                        general: {
                            tags: tags[initiallyCreatedPagesIds[i]]
                        }
                    }
                }
            });
        }

        await until(
            () => listPages({ where: { tags: { query: ["news"] } } }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 4
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { title: "page-a" },
                { title: "page-z" },
                { title: "page-b" },
                { title: "page-x" }
            ])
        );

        await until(
            () => listPages({ where: { tags: { query: ["world", "news"] } } }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { title: "page-a" },
                { title: "page-z" }
            ])
        );

        await until(
            () => listPages({ where: { tags: { query: ["local", "news"] } } }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { title: "page-b" },
                { title: "page-x" }
            ])
        );
    });

    test("searching by text", async () => {
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
            const page = await createPage({
                category
            }).then(([res]) => res.data.pageBuilder.createPage.data);

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
            ([res]) => res.data.pageBuilder.listPages.data[0].title === TITLE_SEO
        );

        await until(
            () =>
                listPages({
                    search: {
                        query: "healthy recipes"
                    }
                }),
            ([res]) => res.data.pageBuilder.listPages.data[0].title === TITLE_HEALTHY_RECIPES
        );

        await until(
            () =>
                listPages({
                    search: {
                        query: "why go serverless"
                    }
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 3
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { title: "Why should you go Serverless today?" },
                { title: "What is Serverless and is it worth it?" },
                { title: "Serverless Side Rendering — The Ultimate Guide" }
            ])
        );

        await until(
            () =>
                listPages({
                    search: {
                        query: "serverless worth it"
                    }
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 3
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { title: "What is Serverless and is it worth it?" },
                { title: "Why should you go Serverless today?" },
                { title: "Serverless Side Rendering — The Ultimate Guide" }
            ])
        );

        // This should return two pages since we're only looking in the "custom" category.
        await until(
            () =>
                listPages({
                    where: {
                        category: "custom"
                    },
                    search: {
                        query: "serverless worth it"
                    }
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { title: "What is Serverless and is it worth it?" },
                { title: "Serverless Side Rendering — The Ultimate Guide" }
            ])
        );
    });
});
