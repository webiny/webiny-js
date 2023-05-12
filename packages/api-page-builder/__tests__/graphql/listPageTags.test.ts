import useGqlHandler from "./useGqlHandler";

jest.setTimeout(100000);

describe("listing tags used by pages", () => {
    const { createCategory, createPage, listPages, updatePage, listPageTags, until } =
        useGqlHandler();

    let initiallyCreatedPagesIds: string[] = [];

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
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letters[i]}`
                }
            });

            initiallyCreatedPagesIds.push(id);
        }
    });

    test("must return tags accordingly", async () => {
        const tags = {
            [initiallyCreatedPagesIds[0]]: ["red", "brown", "green"],
            [initiallyCreatedPagesIds[1]]: ["red", "blue", "yellow"],
            [initiallyCreatedPagesIds[2]]: ["red", "yellow"],
            [initiallyCreatedPagesIds[3]]: ["red", "blue", "yellow", "teal"]
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
            () => listPages({ where: { tags: { query: ["red"] } } }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 4
        );

        await listPageTags({ search: { query: "yell" } }).then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        listPageTags: {
                            data: ["yellow"],
                            error: null
                        }
                    }
                }
            })
        );

        await listPageTags({ search: { query: "re" } }).then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        listPageTags: {
                            data: ["red", "green"],
                            error: null
                        }
                    }
                }
            })
        );
    });

    test("query must consist of at least 2 characters", async () => {
        await listPageTags({ search: { query: "r" } }).then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        listPageTags: {
                            data: null,
                            error: {
                                code: "LIST_TAGS_ERROR",
                                data: null,
                                message: "Please provide at least two characters."
                            }
                        }
                    }
                }
            })
        );
    });
});
