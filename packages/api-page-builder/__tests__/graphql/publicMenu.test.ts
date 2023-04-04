import useGqlHandler from "./useGqlHandler";
import { Page } from "~/types";

jest.setTimeout(100000);

describe("Prepared Menus Test", () => {
    const {
        createMenu,
        getPublicMenu,
        createPage,
        updatePage,
        publishPage,
        listPublishedPages,
        createCategory,
        until
    } = useGqlHandler();

    let initialPages: Page[] = [];

    beforeEach(async () => {
        initialPages = [];
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
            await createPage({ category: "category" }).then(async ([response]) => {
                const { data } = response.data.pageBuilder.createPage;
                await updatePage({
                    id: data.id,
                    data: {
                        title: `page-${letters[i]}`
                    }
                });

                // Publish pages.
                if (["a", "b", "c"].includes(letters[i])) {
                    await publishPage({
                        id: data.id
                    });
                }

                initialPages.push(response.data.pageBuilder.createPage.data);
            });
        }

        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 3
        );
    });

    test("let's ensure the menu is built properly when using getPublicMenu", async () => {
        const [createResponse] = await createMenu({
            data: {
                slug: "test",
                title: "test",
                items: [
                    {
                        type: "link",
                        id: "kj2vizx6",
                        title: "A link",
                        url: "https://www.google.com"
                    },
                    {
                        type: "folder",
                        id: "kj2vj8cg",
                        title: "A folder",
                        expanded: true,
                        children: [
                            {
                                type: "link",
                                id: "kj2vjcuu",
                                title: "A link in folder",
                                url: "https://www.webiny.com"
                            }
                        ]
                    },
                    {
                        type: "page",
                        id: "page-item-1",
                        page: initialPages[0].id,
                        title: "Page A"
                    },
                    {
                        type: "page",
                        id: "page-item-2",
                        page: initialPages[1].id,
                        title: "Page Z"
                    },
                    {
                        type: "page",
                        id: "page-item-3",
                        page: initialPages[2].id,
                        title: "Page B"
                    },
                    {
                        type: "page",
                        id: "page-item-4",
                        page: initialPages[3].id,
                        title: "Page X"
                    },
                    {
                        type: "page",
                        id: "page-item-5",
                        page: initialPages[4].id
                        // title: 'Page C' - Leave out the title intentionally.
                    },
                    {
                        type: "pages-list",
                        id: "kj2vjz7r",
                        title: "Pages List",
                        category: "category",
                        sortBy: "title",
                        sortDir: "asc"
                    }
                ]
            }
        });

        expect(createResponse).toEqual({
            data: {
                pageBuilder: {
                    createMenu: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        const [response] = await getPublicMenu({ slug: "test" });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    getPublicMenu: {
                        data: {
                            items: [
                                {
                                    id: "kj2vizx6",
                                    title: "A link",
                                    type: "link",
                                    url: "https://www.google.com"
                                },
                                {
                                    children: [
                                        {
                                            id: "kj2vjcuu",
                                            title: "A link in folder",
                                            type: "link",
                                            url: "https://www.webiny.com"
                                        }
                                    ],
                                    id: "kj2vj8cg",
                                    title: "A folder",
                                    type: "folder"
                                },
                                {
                                    path: /^\/some-url\/untitled/,
                                    title: "Page A",
                                    type: "page"
                                },
                                {
                                    path: /^\/some-url\/untitled/,
                                    title: "Page B",
                                    type: "page"
                                },
                                {
                                    path: /^\/some-url\/untitled/,
                                    title: "page-c",
                                    type: "page"
                                },
                                {
                                    children: [
                                        {
                                            path: /^\/some-url\/untitled/,
                                            title: "page-a"
                                        },
                                        {
                                            path: /^\/some-url\/untitled/,
                                            title: "page-b"
                                        },
                                        {
                                            path: /^\/some-url\/untitled/,
                                            title: "page-c"
                                        }
                                    ],
                                    id: "kj2vjz7r",
                                    title: "Pages List",
                                    type: "pages-list"
                                }
                            ],
                            slug: "test",
                            title: "test"
                        },
                        error: null
                    }
                }
            }
        });
    });
});
