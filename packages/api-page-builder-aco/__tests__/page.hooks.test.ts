import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { assignPageLifecycleEvents, tracker } from "./mocks/lifecycle.mock";
import { pageContentMock, pageLegacyContentMock } from "./mocks/page.mocks";
import { PB_PAGE_TYPE, ROOT_FOLDER } from "~/contants";

const categorySlug = "category-lifecycle-events";

describe("Pages -> Search records", () => {
    const createDummyCategory = async (pageBuilder: any) => {
        await pageBuilder.createCategory({
            data: {
                slug: categorySlug,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });
    };

    const createDummyPage = async (pageBuilder: any, from?: string) => {
        await createDummyCategory(pageBuilder);
        const [response] = await pageBuilder.createPage({
            ...(from && { from }),
            ...(!from && { category: categorySlug })
        });

        const page = response.data?.pageBuilder?.createPage?.data;

        if (!page) {
            throw new Error(
                response.data?.pageBuilder?.error?.message ||
                    "unknown error while creating dummy page"
            );
        }
        return page;
    };

    beforeEach(async () => {
        tracker.reset();
    });

    it("should have Page Builder Search record GraphQL Query and Mutation", async () => {
        const { introspect } = useGraphQlHandler({});
        const [result] = await introspect();
        expect(result).not.toBeNull();
    });

    it("should create a search record on page creation", async () => {
        const { pageBuilder, search } = useGraphQlHandler({
            plugins: [assignPageLifecycleEvents()]
        });
        const dummyPage = await createDummyPage(pageBuilder);

        await pageBuilder.deletePage({
            id: dummyPage.id
        });
        tracker.reset();

        const { id, pid, title, createdBy, createdOn, savedOn, status, version, locked, path } =
            await createDummyPage(pageBuilder);

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id: pid });

        expect(searchResponse).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: {
                            id: pid,
                            type: PB_PAGE_TYPE,
                            title,
                            content: title,
                            location: {
                                folderId: ROOT_FOLDER
                            },
                            tags: [],
                            data: {
                                id,
                                pid,
                                title,
                                createdBy,
                                createdOn,
                                savedOn,
                                status,
                                version,
                                locked,
                                path
                            }
                        },
                        error: null
                    }
                }
            }
        });

        const [listSearchRecords] = await search.listRecords();

        expect(listSearchRecords).toEqual({
            data: {
                search: {
                    listRecords: {
                        data: [
                            {
                                id: pid,
                                type: PB_PAGE_TYPE,
                                title,
                                content: title,
                                location: {
                                    folderId: ROOT_FOLDER
                                },
                                tags: [],
                                data: {
                                    id,
                                    pid,
                                    title,
                                    createdBy,
                                    createdOn,
                                    savedOn,
                                    status,
                                    version,
                                    locked,
                                    path
                                }
                            }
                        ],
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
    });

    // TODO: revisit this when possible. More information in following lines.
    // This test is failing because of an issue that surfaced while fixing an FLP-related issue.
    // Basically, because of the `WEBINY_API_TEST_STORAGE_ID_CONVERSION_DISABLE` env variable, in
    // Elasticsearch, storage IDs are not used as object property names. Which is fine, but, when
    // Elasticsearch list queries are performed by CMS, within the `where` param, storage IDs *are*
    // actually used, which makes queries return empty results. Last time we were inspecting this,
    // we ended up debugging the `applyFiltering` function, created in the following file:
    // packages/api-headless-cms-ddb-es/src/operations/entry/elasticsearch/filtering/applyFiltering.ts
    it("should create a search record on page creation - disable storageId conversion", async () => {
        process.env.WEBINY_API_TEST_STORAGE_ID_CONVERSION_DISABLE = "true";
        const { pageBuilder, search } = useGraphQlHandler({
            plugins: [assignPageLifecycleEvents()]
        });

        const dummyPage = await createDummyPage(pageBuilder);
        await pageBuilder.deletePage({
            id: dummyPage.id
        });
        tracker.reset();

        const { id, pid, title, createdBy, createdOn, savedOn, status, version, locked, path } =
            await createDummyPage(pageBuilder);

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id: pid });

        expect(searchResponse).toMatchObject({
            data: {
                search: {
                    getRecord: {
                        data: {
                            id: pid,
                            type: PB_PAGE_TYPE,
                            title,
                            content: title,
                            location: {
                                folderId: ROOT_FOLDER
                            },
                            tags: [],
                            data: {
                                id,
                                pid,
                                title,
                                createdBy,
                                createdOn,
                                savedOn,
                                status,
                                version,
                                locked,
                                path
                            }
                        },
                        error: null
                    }
                }
            }
        });

        const [listSearchRecords] = await search.listRecords();

        expect(listSearchRecords).toEqual({
            data: {
                search: {
                    listRecords: {
                        data: [
                            {
                                id: pid,
                                type: PB_PAGE_TYPE,
                                title,
                                content: title,
                                location: {
                                    folderId: ROOT_FOLDER
                                },
                                tags: [],
                                data: {
                                    id,
                                    pid,
                                    title,
                                    createdBy,
                                    createdOn,
                                    savedOn,
                                    status,
                                    version,
                                    locked,
                                    path
                                }
                            }
                        ],
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should update an existing search record after page revision creation", async () => {
        const { pageBuilder, search } = useGraphQlHandler({
            plugins: [assignPageLifecycleEvents()]
        });
        const dummyPage = await createDummyPage(pageBuilder);
        const { pid, title, id } = dummyPage;

        const [response] = await pageBuilder.createPage({
            from: id
        });

        const page = response.data?.pageBuilder?.createPage?.data;

        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(true);
        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id: pid });
        const searchRecord = searchResponse.data?.search?.getRecord?.data;

        expect(searchRecord).toMatchObject({
            title,
            id: pid,
            data: {
                id: page.id,
                title: title,
                status: "draft",
                version: 2,
                locked: false
            }
        });
    });

    it("should update an existing search record", async () => {
        const { pageBuilder, search } = useGraphQlHandler({
            plugins: [assignPageLifecycleEvents()]
        });
        const dummyPage = await createDummyPage(pageBuilder);
        const { pid, title, id } = dummyPage;

        const [update] = await pageBuilder.updatePage({
            id,
            data: {
                title: `${title} + update`,
                content: pageContentMock,
                settings: {
                    general: {
                        tags: ["tag1"]
                    }
                }
            }
        });

        const updatePage = update.data?.pageBuilder?.updatePage?.data;

        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id: pid });
        const searchRecord = searchResponse.data?.search?.getRecord?.data;

        expect(searchRecord).toMatchObject({
            id: pid,
            title: updatePage.title,
            content: `${updatePage.title} Demo Heading Demo Content with multiple spaces and new line Demo button Demo Image 1 Demo Image 2 Demo Image 3`,
            tags: ["tag1"],
            data: {
                title: updatePage.title,
                savedOn: updatePage.savedOn
            }
        });
    });

    it("should update an existing search record with legacy content (NO lexical-editor)", async () => {
        const { pageBuilder, search } = useGraphQlHandler({
            plugins: [assignPageLifecycleEvents()]
        });
        const dummyPage = await createDummyPage(pageBuilder);
        const { pid, title, id } = dummyPage;

        const [update] = await pageBuilder.updatePage({
            id,
            data: {
                title: `${title} + update`,
                content: pageLegacyContentMock
            }
        });

        const updatePage = update.data?.pageBuilder?.updatePage?.data;

        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id: pid });
        const searchRecord = searchResponse.data?.search?.getRecord?.data;

        expect(searchRecord).toMatchObject({
            id: pid,
            title: updatePage.title,
            content: `${updatePage.title} Demo Heading Demo Content with multiple spaces and new line Demo button Demo Image 1 Demo Image 2 Demo Image 3`,
            data: {
                title: updatePage.title,
                savedOn: updatePage.savedOn
            }
        });
    });

    it("should update an existing search record on page publish and unpublish", async () => {
        const { pageBuilder, search } = useGraphQlHandler({
            plugins: [assignPageLifecycleEvents()]
        });
        const dummyPage = await createDummyPage(pageBuilder);
        const { pid, id } = dummyPage;

        await pageBuilder.publishPage({
            id
        });

        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(true);

        const [publishedSearchResponse] = await search.getRecord({ id: pid });
        const publishedSearchRecord = publishedSearchResponse.data?.search?.getRecord?.data;

        expect(publishedSearchRecord).toMatchObject({
            id: pid,
            data: {
                status: "published",
                locked: true,
                version: 1
            }
        });

        await pageBuilder.unpublishPage({
            id
        });

        expect(tracker.isExecutedOnce("page:beforeUnpublish")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterUnpublish")).toEqual(true);

        const [unpublishedSearchResponse] = await search.getRecord({ id: pid });
        const unpublishedSearchRecord = unpublishedSearchResponse.data?.search?.getRecord?.data;

        expect(unpublishedSearchRecord).toMatchObject({
            id: expect.stringContaining(pid),
            data: {
                status: "unpublished",
                locked: true,
                version: 1
            }
        });
    });

    it("should delete a search record in case a page has been deleted via page pid", async () => {
        const { pageBuilder, search } = useGraphQlHandler({
            plugins: [assignPageLifecycleEvents()]
        });
        const pageV1 = await createDummyPage(pageBuilder);
        await createDummyPage(pageBuilder, pageV1.id);

        await pageBuilder.deletePage({
            id: pageV1.pid
        });

        expect(tracker.isExecuted("page:beforeDelete")).toEqual(true);
        expect(tracker.isExecuted("page:afterDelete")).toEqual(true);

        const [getResponse] = await search.getRecord({ id: pageV1.pid });

        expect(getResponse).toMatchObject({
            data: {
                search: {
                    getRecord: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: {
                                id: pageV1.pid
                            }
                        }
                    }
                }
            }
        });
    });

    it("should delete a search record in case all page revisions has been deleted", async () => {
        const { pageBuilder, search } = useGraphQlHandler({
            plugins: [assignPageLifecycleEvents()]
        });
        const pageV1 = await createDummyPage(pageBuilder);
        const pageV2 = await createDummyPage(pageBuilder, pageV1.id);

        await pageBuilder.deletePage({
            id: pageV1.id
        });

        await pageBuilder.deletePage({
            id: pageV2.id
        });

        expect(tracker.isExecuted("page:beforeDelete")).toEqual(true);
        expect(tracker.isExecuted("page:afterDelete")).toEqual(true);

        const [getResponse] = await search.getRecord({ id: pageV1.pid });

        expect(getResponse).toMatchObject({
            data: {
                search: {
                    getRecord: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: {
                                id: pageV1.pid
                            }
                        }
                    }
                }
            }
        });
    });

    it("should update a search record in case a page revision has been deleted, but there are other page revisions available", async () => {
        const { pageBuilder, search } = useGraphQlHandler({
            plugins: [assignPageLifecycleEvents()]
        });
        const pageV1 = await createDummyPage(pageBuilder);
        const pageV2 = await createDummyPage(pageBuilder, pageV1.id);

        expect(pageV2.pid).toEqual(pageV1.pid);

        {
            // Testing to find v2 id within the search record
            const [response] = await search.getRecord({ id: pageV1.pid });
            const searchRecord = response.data?.search?.getRecord?.data;

            expect(searchRecord).toMatchObject({
                id: pageV2.pid,
                data: {
                    id: pageV2.id,
                    version: pageV2.version
                }
            });
        }

        await pageBuilder.deletePage({
            id: pageV2.id
        });

        expect(tracker.isExecuted("page:beforeDelete")).toEqual(true);
        expect(tracker.isExecuted("page:afterDelete")).toEqual(true);

        {
            // Testing the search record update with v1 data
            const [response] = await search.getRecord({ id: pageV1.pid });
            const searchRecord = response.data?.search?.getRecord?.data;

            expect(searchRecord).toMatchObject({
                id: pageV1.pid,
                data: {
                    id: pageV1.id,
                    version: pageV1.version
                }
            });
        }
    });
});
