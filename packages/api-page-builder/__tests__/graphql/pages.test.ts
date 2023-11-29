import useGqlHandler from "./useGqlHandler";

import { defaultIdentity } from "../tenancySecurity";
import { expectCompressed } from "~tests/graphql/utils/expectCompressed";
import { decompress } from "./utils/compression";

jest.setTimeout(100000);

describe("CRUD Test", () => {
    const handler = useGqlHandler();

    const {
        createBlockCategory,
        createCategory,
        createPage,
        createPageBlock,
        createPageElement,
        deletePage,
        listPages,
        getPage,
        updatePage,
        updatePageBlock,
        until
    } = handler;

    test("create, read, update and delete pages", async () => {
        const [createPageUnknownResponse] = await createPage({ category: "unknown" });
        expect(createPageUnknownResponse).toEqual({
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
            let data: Record<string, any> = {
                category: "slug"
            };

            const [createPageResponse] = await createPage(data);
            expect(createPageResponse).toMatchObject({
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
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });

            let { id } = createPageResponse.data.pageBuilder.createPage.data;

            ids.push(id);
            const [getPageResponse] = await getPage({ id });

            expect(getPageResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        getPage: {
                            data: {
                                category: {
                                    slug: "slug"
                                },
                                editor: "page-builder",
                                createdOn: expect.stringMatching(/^20/),
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });

            id = getPageResponse.data.pageBuilder.getPage.data.id;

            data = {
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

            await updatePage({
                id,
                data
            });
        }

        const [listAfterUpdateResponse] = await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => {
                const data: any[] = res.data.pageBuilder.listPages.data;
                return data.length === 3 && data.every(obj => obj.title.match(/title-UPDATED-/));
            },
            {
                name: "list pages after update",
                tries: 20
            }
        );

        expect(listAfterUpdateResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                editor: "page-builder",
                                category: {
                                    slug: "slug"
                                },
                                createdBy: defaultIdentity,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
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
                                createdBy: defaultIdentity,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
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
                                createdBy: defaultIdentity,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
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
        for (let i = 0; i < listAfterUpdateResponse.data.pageBuilder.listPages.data.length; i++) {
            const { id } = listAfterUpdateResponse.data.pageBuilder.listPages.data[i];
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
                                    createdOn: expect.stringMatching(/^20/),
                                    createdBy: defaultIdentity
                                }
                            },
                            error: null
                        }
                    }
                }
            });
        }

        const [listPagesAfterDeleteResponse] = await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => {
                return res.data.pageBuilder.listPages.data.length === 0;
            },
            {
                name: "list pages after delete",
                tries: 20
            }
        );

        expect(listPagesAfterDeleteResponse).toEqual({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [],
                        error: null,
                        meta: {
                            cursor: null,
                            hasMoreItems: false,
                            totalCount: 0
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
                            createdOn: expect.stringMatching(/^20/),
                            createdBy: defaultIdentity
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
                            message: `Page not found.`
                        }
                    }
                }
            }
        });
    });

    it("should create multiple page revisions and sort them properly", async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `Category`,
                url: `/category-url/`,
                layout: `layout`
            }
        });

        const page = await createPage({ category: "category" }).then(([res]) => {
            return res.data.pageBuilder.createPage.data;
        });
        const revisions: string[] = [page.id];
        const total = 25;

        for (let i = revisions.length; i < total; i++) {
            const [revisionResponse] = await createPage({
                from: revisions[i - 1],
                category: "category"
            });

            expect(revisionResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        createPage: {
                            data: {
                                id: `${page.pid}#${String(i + 1).padStart(4, "0")}`
                            },
                            error: null
                        }
                    }
                }
            });

            revisions.push(revisionResponse.data.pageBuilder.createPage.data.id);
        }

        const [pageDataResponse] = await until(
            () =>
                getPage({
                    id: page.id
                }),
            ([res]: any) => {
                return res.data.pageBuilder.getPage.data.revisions.length === total;
            },
            {
                name: "get page with revisions",
                tries: 20
            }
        );

        expect(pageDataResponse).toMatchObject({
            data: {
                pageBuilder: {
                    getPage: {
                        data: {
                            id: page.id,
                            revisions: revisions
                                .map(rev => {
                                    return {
                                        id: rev
                                    };
                                })
                                .reverse() // We reverse the array because API returns revisions in DESC order.
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("get page with resolved reference block", async () => {
        // Create page block and add element inside of it
        const [createBlockCategoryResponse] = await createBlockCategory({
            data: {
                slug: "block-category",
                name: "block-category-name",
                icon: "block-category-icon",
                description: "block-category-description"
            }
        });
        expect(createBlockCategoryResponse).toMatchObject({
            data: {
                pageBuilder: {
                    createBlockCategory: {
                        data: {
                            slug: "block-category"
                        },
                        error: null
                    }
                }
            }
        });

        const [createPageBlockResponse] = await createPageBlock({
            data: {
                name: "block-name",
                blockCategory: "block-category",
                content: { data: {}, elements: [], type: "block" }
            }
        });

        const blockData = createPageBlockResponse.data.pageBuilder.createPageBlock.data;

        const [createPageElementResponse] = await createPageElement({
            data: {
                name: "element-name",
                type: "element",
                content: { some: "element-content" }
            }
        });

        const pageElementData = createPageElementResponse.data.pageBuilder.createPageElement.data;

        const uncompressedBlock = await decompress(blockData);

        const updatedContent = {
            ...uncompressedBlock,
            elements: [...uncompressedBlock.content.elements, pageElementData]
        };
        const [updatePageBlockResult] = await updatePageBlock({
            id: blockData.id,
            data: {
                content: updatedContent
            }
        });
        expect(updatePageBlockResult).toMatchObject({
            data: {
                pageBuilder: {
                    updatePageBlock: {
                        data: {
                            id: blockData.id,
                            content: expectCompressed()
                        },
                        error: null
                    }
                }
            }
        });

        // Create page
        await createCategory({
            data: {
                slug: "category-slug",
                name: "category-name",
                url: "/category-url/",
                layout: "category-layout"
            }
        });

        const [createPageResponse] = await createPage({
            category: "category-slug"
        });

        const pageId = createPageResponse.data.pageBuilder.createPage.data.id;

        // Add block to the page as reference (without elements)
        await updatePage({
            id: pageId,
            data: {
                content: {
                    data: {},
                    elements: [
                        { data: { blockId: blockData.id }, elements: [], path: [], type: "block" }
                    ],
                    path: [],
                    type: "document"
                }
            }
        });

        // Get page with resolved block (with elements)
        const [getPageWithReferenceBlockResponse] = await getPage({ id: pageId });

        const resolvedBlockData =
            getPageWithReferenceBlockResponse.data.pageBuilder.getPage.data.content.elements[0];

        expect(resolvedBlockData).toMatchObject({
            data: { blockId: blockData.id },
            elements: [
                {
                    id: pageElementData.id,
                    name: "element-name",
                    content: { some: "element-content" },
                    type: "element",
                    createdOn: expect.stringMatching(/^20/),
                    createdBy: defaultIdentity
                }
            ],
            path: [],
            type: "block"
        });
    });
});
