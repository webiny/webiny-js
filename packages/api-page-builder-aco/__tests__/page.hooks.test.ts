import { useGraphQlHandler } from "./utils/useGraphQlHandler";

import { assignPageLifecycleEvents, tracker } from "./mocks/lifecycle.mock";
import { pageContentMock } from "./mocks/page.mocks";
import { PB_PAGE_TYPE, ROOT_FOLDER } from "~/contants";
import { Page } from "@webiny/api-page-builder/types";

const categorySlug = "category-lifecycle-events";

describe("Pages -> Search records", () => {
    const { pageBuilder, search } = useGraphQlHandler({
        plugins: [assignPageLifecycleEvents()]
    });

    const createDummyCategory = async () => {
        await pageBuilder.createCategory({
            data: {
                slug: categorySlug,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });
    };

    const createDummyPage = async () => {
        const [response] = await pageBuilder.createPage({
            category: categorySlug
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

    let dummyPage: Page;

    beforeEach(async () => {
        await createDummyCategory();
        dummyPage = await createDummyPage();
        tracker.reset();
    });

    it("should create a search record on page creation", async () => {
        const { pid, title, id, createdOn, createdBy, savedOn, status, version, locked } =
            await createDummyPage();

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id: pid });
        const searchRecord = searchResponse.data?.search?.getRecord?.data;

        expect(searchRecord).toMatchObject({
            originalId: pid,
            type: PB_PAGE_TYPE,
            title,
            content: title,
            location: {
                folderId: ROOT_FOLDER
            },
            data: {
                id,
                title,
                createdBy,
                createdOn,
                savedOn,
                status,
                version,
                locked
            }
        });
    });

    it("should update an existing search record after page revision creation", async () => {
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
            originalId: pid,
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
        const { pid, title, id } = dummyPage;

        const [update] = await pageBuilder.updatePage({
            id,
            data: {
                title: `${title} + update`,
                content: pageContentMock
            }
        });

        const updatePage = update.data?.pageBuilder?.updatePage?.data;

        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id: pid });
        const searchRecord = searchResponse.data?.search?.getRecord?.data;

        expect(searchRecord).toMatchObject({
            originalId: pid,
            title: updatePage.title,
            content: `${updatePage.title} Demo Heading Demo Content Demo button Demo Image 1 Demo Image 2 Demo Image 3`,
            data: {
                title: updatePage.title,
                savedOn: updatePage.savedOn
            }
        });
    });

    it("should update an existing search record on page publish and unpublish", async () => {
        const { pid, id } = dummyPage;

        await pageBuilder.publishPage({
            id
        });

        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(true);

        const [publishedSearchResponse] = await search.getRecord({ id: pid });
        const publishedSearchRecord = publishedSearchResponse.data?.search?.getRecord?.data;

        expect(publishedSearchRecord).toMatchObject({
            originalId: pid,
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
            originalId: pid,
            data: {
                status: "unpublished",
                locked: true,
                version: 1
            }
        });
    });

    it("should delete a search record on page deletion", async () => {
        const { pid, id } = dummyPage;

        await pageBuilder.deletePage({
            id
        });

        expect(tracker.isExecutedOnce("page:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterDelete")).toEqual(true);

        const [deletedResponse] = await search.getRecord({ id: pid });

        expect(deletedResponse).toMatchObject({
            data: {
                search: {
                    getRecord: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });
    });
});
